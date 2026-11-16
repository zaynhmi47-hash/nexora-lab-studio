import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0003_course_offerings"),
        ("identity", "0001_initial"),
        ("organizations", "0001_initial"),
    ]
    operations = [
        migrations.CreateModel(
            name="AcademicStudyPlan",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("submitted", "Submitted"), ("revision", "Needs Revision"), ("approved", "Approved"), ("rejected", "Rejected"), ("locked", "Locked")], db_index=True, default="draft", max_length=16)),
                ("max_credit_units", models.PositiveSmallIntegerField(default=24, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(60)])),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("decided_at", models.DateTimeField(blank=True, null=True)),
                ("advisor_note", models.TextField(blank=True)),
                ("decided_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="decided_study_plans", to="identity.nexorauser")),
                ("membership", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_study_plans", to="organizations.membership")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_study_plans", to="organizations.organization")),
                ("term", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="study_plans", to="academic.academicterm")),
            ],
            options={"db_table": "academic_study_plans"},
        ),
        migrations.CreateModel(
            name="AcademicStudyPlanItem",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("credit_units_snapshot", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(12)])),
                ("offering", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="study_plan_items", to="academic.academiccourseoffering")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_study_plan_items", to="organizations.organization")),
                ("study_plan", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="academic.academicstudyplan")),
            ],
            options={"db_table": "academic_study_plan_items"},
        ),
        migrations.AddConstraint(model_name="academicstudyplan", constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "membership", "term"), name="academic_study_plan_member_term_unique")),
        migrations.AddConstraint(model_name="academicstudyplan", constraint=models.CheckConstraint(condition=models.Q(("max_credit_units__gte", 1), ("max_credit_units__lte", 60)), name="academic_study_plan_credit_range")),
        migrations.AddIndex(model_name="academicstudyplan", index=models.Index(fields=["organization", "term", "status"], name="acad_study_plan_status_idx")),
        migrations.AddConstraint(model_name="academicstudyplanitem", constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("study_plan", "offering"), name="academic_study_plan_offering_unique")),
        migrations.AddConstraint(model_name="academicstudyplanitem", constraint=models.CheckConstraint(condition=models.Q(("credit_units_snapshot__gte", 1), ("credit_units_snapshot__lte", 12)), name="academic_study_plan_item_credit_range")),
    ]
