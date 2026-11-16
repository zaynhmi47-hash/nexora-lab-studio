import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0004_study_plans"),
        ("identity", "0001_initial"),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicCoursePrerequisite",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("is_mandatory", models.BooleanField(default=True)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="prerequisite_rules", to="academic.academiccourse")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_course_prerequisites", to="organizations.organization")),
                ("prerequisite_course", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="required_by_rules", to="academic.academiccourse")),
            ],
            options={"db_table": "academic_course_prerequisites"},
        ),
        migrations.CreateModel(
            name="AcademicCourseCompletion",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("pending", "Pending Verification"), ("verified", "Verified"), ("rejected", "Rejected")], db_index=True, default="pending", max_length=12)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                ("evidence_reference", models.CharField(blank=True, max_length=160)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="completion_records", to="academic.academiccourse")),
                ("membership", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_course_completions", to="organizations.membership")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_course_completions", to="organizations.organization")),
                ("verified_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="verified_course_completions", to="identity.nexorauser")),
            ],
            options={"db_table": "academic_course_completions"},
        ),
        migrations.AddConstraint(
            model_name="academiccourseprerequisite",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "course", "prerequisite_course"), name="academic_course_prereq_unique"),
        ),
        migrations.AddConstraint(
            model_name="academiccourseprerequisite",
            constraint=models.CheckConstraint(condition=models.Q(("course", models.F("prerequisite_course")), _negated=True), name="academic_course_prereq_not_self"),
        ),
        migrations.AddIndex(
            model_name="academiccourseprerequisite",
            index=models.Index(fields=["organization", "course"], name="acad_prereq_course_idx"),
        ),
        migrations.AddIndex(
            model_name="academiccoursecompletion",
            index=models.Index(fields=["organization", "membership", "course", "status"], name="acad_completion_lookup_idx"),
        ),
    ]
