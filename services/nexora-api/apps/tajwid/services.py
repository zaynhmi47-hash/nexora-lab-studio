from django.db import transaction
from django.utils import timezone

from apps.identity.models import NexoraUser

from .models import (
    TajwidPracticeCompletion,
    TajwidPracticeItem,
    TajwidProgress,
    TajwidTopic,
    TajwidTopicCompletion,
)


class TajwidService:
    @staticmethod
    def topics(user: NexoraUser):
        completed = set(
            TajwidTopicCompletion.objects.filter(
                user=user, deleted_at__isnull=True
            ).values_list("topic_id", flat=True)
        )
        topics = TajwidTopic.objects.filter(
            is_published=True, deleted_at__isnull=True
        ).order_by("sort_order")
        result = []
        previous_completed = True
        for topic in topics:
            done = topic.id in completed
            if done:
                status = "completed"
            elif previous_completed:
                status = "available"
            else:
                status = "locked"
            if not done:
                previous_completed = False
            result.append({
                "id": topic.key,
                "title": topic.title,
                "shortDescription": topic.short_description,
                "order": topic.sort_order,
                "status": status,
                "xpReward": topic.xp_reward,
            })
        return result

    @staticmethod
    def progress(user: NexoraUser):
        progress, _ = TajwidProgress.objects.get_or_create(user=user)
        completed = TajwidTopicCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).values_list("topic__key", flat=True)
        return {
            "userId": str(user.id),
            "completedTopicIds": list(completed),
            "practiceCompleted": progress.practice_completed,
            "assessmentCompleted": progress.assessment_completed,
            "xpEarned": progress.xp_earned,
        }

    @staticmethod
    def practice(topic_key):
        topic = TajwidTopic.objects.filter(
            key=topic_key, is_published=True, deleted_at__isnull=True
        ).first()
        if topic is None:
            return None
        return [{
            "id": item.key,
            "topicId": topic.key,
            "prompt": item.prompt,
            "options": item.options,
            "correctOptionIndex": item.correct_option_index,
            "explanation": item.explanation,
        } for item in TajwidPracticeItem.objects.filter(
            topic=topic, deleted_at__isnull=True
        )]

    @transaction.atomic
    def complete_practice(self, user: NexoraUser, practice_key, correct):
        item = TajwidPracticeItem.objects.filter(
            key=practice_key, deleted_at__isnull=True, topic__is_published=True, topic__deleted_at__isnull=True
        ).first()
        if item is None:
            raise ValueError("Tajwid practice item not found.")
        completion, created = TajwidPracticeCompletion.objects.get_or_create(
            user=user,
            practice_item=item,
            defaults={"completed_at": timezone.now()},
        )
        if not created and completion.deleted_at is not None:
            completion.deleted_at = None
            completion.completed_at = timezone.now()
            completion.save(update_fields=["deleted_at", "completed_at", "updated_at"])
            created = True
        progress, _ = TajwidProgress.objects.get_or_create(user=user)
        if created:
            progress.practice_completed += 1
            if correct:
                progress.xp_earned += 5
            progress.save(update_fields=["practice_completed", "xp_earned", "updated_at"])
        return self.progress(user)

    @transaction.atomic
    def complete_topic(self, user: NexoraUser, topic_key):
        topic = TajwidTopic.objects.filter(
            key=topic_key, is_published=True, deleted_at__isnull=True
        ).first()
        if topic is None:
            raise ValueError("Tajwid topic not found.")
        completion, created = TajwidTopicCompletion.objects.get_or_create(
            user=user, topic=topic,
            defaults={"completed_at": timezone.now()},
        )
        if not created and completion.deleted_at is not None:
            completion.deleted_at = None
            completion.completed_at = timezone.now()
            completion.save(update_fields=["deleted_at", "completed_at", "updated_at"])
            created = True
        progress, _ = TajwidProgress.objects.get_or_create(user=user)
        if created:
            progress.xp_earned += topic.xp_reward
            progress.save(update_fields=["xp_earned", "updated_at"])
        return self.progress(user)

    @transaction.atomic
    def complete_assessment(self, user: NexoraUser, correct, total):
        if total <= 0:
            raise ValueError("Total questions must be greater than zero.")
        progress, _ = TajwidProgress.objects.get_or_create(user=user)
        passed = correct / total >= 0.7
        if passed and not progress.assessment_completed:
            progress.assessment_completed = True
            progress.xp_earned += 100
        progress.save(update_fields=["assessment_completed", "xp_earned", "updated_at"])
        return self.progress(user)
