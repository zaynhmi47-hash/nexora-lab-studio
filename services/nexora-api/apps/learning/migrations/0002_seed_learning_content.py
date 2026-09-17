from django.db import migrations


COURSES = [
    {
        "key": "quran-foundations",
        "title": "Quran Foundations",
        "description": "Build a strong foundation for reading the Quran.",
        "level": 1,
        "sort_order": 1,
        "lessons": [
            ("arabic-alphabet", "Arabic Alphabet", "Recognize the Arabic letters.", "lesson", 1, 20),
            ("harakat", "Harakat", "Learn the basic vowel marks.", "lesson", 2, 20),
            ("makharij", "Makharij", "Practice articulation points.", "practice", 3, 30),
            ("tajwid-foundations", "Tajwid Foundations", "Learn the core rules before deeper practice.", "lesson", 4, 40),
            ("tahsin", "Tahsin", "Improve reading accuracy through guided practice.", "practice", 5, 50),
        ],
    },
    {
        "key": "kitab-kuning",
        "title": "Kitab Kuning Foundations",
        "description": "An introductory path for classical Islamic texts.",
        "level": 4,
        "sort_order": 2,
        "lessons": [
            ("kitab-intro", "Introduction to Kitab Kuning", "Understand the learning path and study conventions.", "lesson", 1, 50),
        ],
    },
]

QUIZZES = {
    "harakat": [
        ("harakat-q1", "Which topic is this lesson designed to introduce?", ["Basic vowel marks", "Travel documents", "Hadith grading", "Qibla calculation"], 0, "Harakat are Arabic vowel marks used in reading practice."),
        ("harakat-q2", "What is the main purpose of learning harakat in this path?", ["Support accurate reading practice", "Calculate prayer times", "Track travel distance", "Store bookmarks"], 0, "The lesson uses vowel-mark recognition as a foundation for reading practice."),
    ],
    "makharij": [
        ("makharij-q1", "What does this practice focus on?", ["Articulation points", "Travel planning", "Book lending", "Account settings"], 0, "Makharij practice focuses on the articulation points used when producing letters."),
        ("makharij-q2", "What is the intended outcome of articulation practice?", ["More accurate pronunciation practice", "A longer reading streak automatically", "A new user account", "A saved audio file"], 0, "The goal is guided practice toward more accurate articulation."),
    ],
    "tajwid-foundations": [
        ("tajwid-q1", "What does this lesson introduce?", ["Core tajwid rules", "Travel checklists", "Qibla coordinates", "Profile settings"], 0, "This learning activity is the foundation for deeper tajwid practice."),
        ("tajwid-q2", "Why is this lesson placed before deeper practice?", ["It establishes foundational concepts", "It unlocks unrelated account settings", "It replaces the Quran reader", "It changes the device language"], 0, "Foundational concepts are introduced before more advanced guided practice."),
    ],
    "tahsin": [
        ("tahsin-q1", "What is the focus of this activity?", ["Improving reading accuracy", "Managing travel documents", "Creating a bookmark folder", "Changing notification settings"], 0, "Tahsin is represented here as guided practice for improving reading accuracy."),
        ("tahsin-q2", "How is improvement represented in this prototype?", ["Through guided practice", "By skipping all lessons", "By changing the profile name", "By opening a map"], 0, "The prototype models tahsin as guided learning and practice."),
    ],
}


def seed(apps, schema_editor):
    Course = apps.get_model("learning", "LearningCourse")
    Lesson = apps.get_model("learning", "LearningLesson")
    Question = apps.get_model("learning", "LearningQuizQuestion")
    for course_data in COURSES:
        lessons = course_data.pop("lessons")
        course, _ = Course.objects.update_or_create(key=course_data["key"], defaults=course_data)
        for key, title, description, kind, order, xp in lessons:
            lesson, _ = Lesson.objects.update_or_create(
                key=key,
                defaults={"course": course, "title": title, "description": description, "kind": kind, "sort_order": order, "xp_reward": xp, "is_published": True},
            )
            for q_order, (qkey, prompt, options, correct, explanation) in enumerate(QUIZZES.get(key, []), start=1):
                Question.objects.update_or_create(
                    key=qkey,
                    defaults={"lesson": lesson, "prompt": prompt, "options": options, "correct_option_index": correct, "explanation": explanation, "sort_order": q_order},
                )


def unseed(apps, schema_editor):
    Course = apps.get_model("learning", "LearningCourse")
    Course.objects.filter(key__in=[item["key"] for item in COURSES]).delete()


class Migration(migrations.Migration):
    dependencies = [("learning", "0001_initial")]
    operations = [migrations.RunPython(seed, unseed)]
