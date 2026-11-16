import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


def provision_grade_permission(apps, schema_editor):
    Permission = apps.get_model("access", "Permission")
    Role = apps.get_model("access", "Role")
    RolePermission = apps.get_model("access", "RolePermission")
    permission, _ = Permission.objects.get_or_create(
        code="academic.grade",
        defaults={
            "name": "Academic grading",
            "description": "Record and publish grades for assigned teaching enrollments.",
            "category": "academic",
            "is_system": True,
        },
    )
    for role in Role.objects.filter(slug__in=("owner", "admin", "member"), deleted_at__isnull=True):
        RolePermission.objects.get_or_create(role=role, permission=permission)


def remove_grade_permission(apps, schema_editor):
    Permission = apps.get_model("access", "Permission")
    RolePermission = apps.get_model("access", "RolePermission")
    RolePermission.objects.filter(permission__code="academic.grade").delete()
    Permission.objects.filter(code="academic.grade").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0006_offering_schedules"),
        ("access", "0001_initial"),
        ("identity", "0001_initial"),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicGradingPolicy",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("active", "Active"), ("locked", "Locked")], db_index=True, default="draft", max_length=12)),
                ("passing_score", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ("offering", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="grading_policy", to="academic.academiccourseoffering")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_grading_policies", to="organizations.organization")),
            ],
            options={"db_table": "academic_grading_policies"},
        ),
        migrations.CreateModel(
            name="AcademicAssessmentComponent",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.CharField(max_length=32)),
                ("name", models.CharField(max_length=120)),
                ("weight_percent", models.DecimalField(decimal_places=2, max_digits=5, validators=[django.core.validators.MinValueValidator(0.01), django.core.validators.MaxValueValidator(100)])),
                ("max_score", models.DecimalField(decimal_places=2, max_digits=8, validators=[django.core.validators.MinValueValidator(0.01)])),
                ("sequence", models.PositiveSmallIntegerField(default=1)),
                ("is_active", models.BooleanField(default=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_assessment_components", to="organizations.organization")),
                ("policy", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="components", to="academic.academicgradingpolicy")),
            ],
            options={"db_table": "academic_assessment_components", "ordering": ("sequence", "code")},
        ),
        migrations.CreateModel(
            name="AcademicGradeEntry",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("score", models.DecimalField(decimal_places=2, max_digits=8, validators=[django.core.validators.MinValueValidator(0)])),
                ("feedback", models.TextField(blank=True)),
                ("revision", models.PositiveSmallIntegerField(default=1)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("published", "Published")], db_index=True, default="draft", max_length=12)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("component", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="grade_entries", to="academic.academicassessmentcomponent")),
                ("membership", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_grade_entries", to="organizations.membership")),
                ("offering", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="grade_entries", to="academic.academiccourseoffering")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_grade_entries", to="organizations.organization")),
                ("published_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="published_academic_grades", to="identity.nexorauser")),
                ("recorded_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="recorded_academic_grades", to="identity.nexorauser")),
                ("supersedes", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="revisions", to="academic.academicgradeentry")),
            ],
            options={"db_table": "academic_grade_entries"},
        ),
        migrations.CreateModel(
            name="AcademicFinalGrade",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("weighted_score", models.DecimalField(decimal_places=2, max_digits=6, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ("is_pass", models.BooleanField(blank=True, null=True)),
                ("revision", models.PositiveSmallIntegerField(default=1)),
                ("status", models.CharField(choices=[("published", "Published")], default="published", max_length=12)),
                ("published_at", models.DateTimeField()),
                ("membership", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_final_grades", to="organizations.membership")),
                ("offering", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="final_grades", to="academic.academiccourseoffering")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_final_grades", to="organizations.organization")),
                ("published_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="published_final_grades", to="identity.nexorauser")),
                ("supersedes", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="revisions", to="academic.academicfinalgrade")),
            ],
            options={"db_table": "academic_final_grades"},
        ),
        migrations.AddConstraint(
            model_name="academicassessmentcomponent",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("policy", "code"), name="academic_assessment_policy_code_unique"),
        ),
        migrations.AddConstraint(
            model_name="academicassessmentcomponent",
            constraint=models.CheckConstraint(condition=models.Q(("weight_percent__gt", 0), ("weight_percent__lte", 100)), name="academic_assessment_weight_range"),
        ),
        migrations.AddConstraint(
            model_name="academicassessmentcomponent",
            constraint=models.CheckConstraint(condition=models.Q(("max_score__gt", 0)), name="academic_assessment_max_score_positive"),
        ),
        migrations.AddConstraint(
            model_name="academicgradeentry",
            constraint=models.UniqueConstraint(fields=("component", "membership", "revision"), name="academic_grade_revision_unique"),
        ),
        migrations.AddConstraint(
            model_name="academicgradeentry",
            constraint=models.CheckConstraint(condition=models.Q(("revision__gte", 1)), name="academic_grade_revision_positive"),
        ),
        migrations.AddConstraint(
            model_name="academicfinalgrade",
            constraint=models.UniqueConstraint(fields=("offering", "membership", "revision"), name="academic_final_grade_revision_unique"),
        ),
        migrations.AddIndex(model_name="academicgradingpolicy", index=models.Index(fields=["organization", "status"], name="acad_grade_policy_status_idx")),
        migrations.AddIndex(model_name="academicassessmentcomponent", index=models.Index(fields=["organization", "policy", "is_active"], name="acad_assessment_policy_idx")),
        migrations.AddIndex(model_name="academicgradeentry", index=models.Index(fields=["organization", "offering", "membership"], name="acad_grade_roster_idx")),
        migrations.AddIndex(model_name="academicgradeentry", index=models.Index(fields=["component", "status"], name="acad_grade_comp_status_idx")),
        migrations.AddIndex(model_name="academicfinalgrade", index=models.Index(fields=["organization", "membership", "published_at"], name="acad_final_grade_student_idx")),
        migrations.RunPython(provision_grade_permission, remove_grade_permission),
    ]
