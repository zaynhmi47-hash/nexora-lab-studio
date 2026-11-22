from .models import CareerExperience, CareerProject


class CareerService:
    @staticmethod
    def list_experiences(*, user):
        return CareerExperience.objects.filter(user=user, deleted_at__isnull=True)

    @staticmethod
    def create_experience(*, user, **data):
        item = CareerExperience(user=user, **data)
        item.full_clean()
        item.save()
        return item

    @staticmethod
    def update_experience(*, user, experience_id, **data):
        item = CareerExperience.objects.get(id=experience_id, user=user, deleted_at__isnull=True)
        for field, value in data.items():
            setattr(item, field, value)
        item.full_clean()
        item.save(update_fields=[*data.keys(), "updated_at"])
        return item

    @staticmethod
    def delete_experience(*, user, experience_id):
        item = CareerExperience.objects.get(id=experience_id, user=user, deleted_at__isnull=True)
        item.soft_delete()

    @staticmethod
    def list_projects(*, user):
        return CareerProject.objects.filter(user=user, deleted_at__isnull=True)

    @staticmethod
    def create_project(*, user, **data):
        item = CareerProject(user=user, **data)
        item.full_clean()
        item.save()
        return item

    @staticmethod
    def update_project(*, user, project_id, **data):
        item = CareerProject.objects.get(id=project_id, user=user, deleted_at__isnull=True)
        for field, value in data.items():
            setattr(item, field, value)
        item.full_clean()
        item.save(update_fields=[*data.keys(), "updated_at"])
        return item

    @staticmethod
    def delete_project(*, user, project_id):
        item = CareerProject.objects.get(id=project_id, user=user, deleted_at__isnull=True)
        item.soft_delete()
