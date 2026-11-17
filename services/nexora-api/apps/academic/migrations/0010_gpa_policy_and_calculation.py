import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0009_grading_scale_foundation"),
    ]

    operations = [
        migrations.AddField(
            model_name="academicfinalgrade",
            name="course_code_snapshot",
            field=models.CharField(blank=True, max_length=32, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="academicfinalgrade",
            name="course_name_snapshot",
            field=models.CharField(blank=True, max_length=180, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="academicfinalgrade",
            name="credit_units_snapshot",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="AcademicGpaPolicy",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("version", models.PositiveSmallIntegerField()),
                ("retake_strategy", models.CharField(choices=[("highest", "Highest grade points"), ("latest", "Latest attempt"), ("first", "First attempt")], default="highest", max_length=12)),
                ("include_failed_grades", models.BooleanField(default=True)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("grading_scale", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="gpa_policies", to="academic.academicgradingscale")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_gpa_policies", to="organizations.organization")),
            ],
            options={"db_table": "academic_gpa_policies", "ordering": ("-version",)},
        ),
        migrations.CreateModel(
            name="AcademicGpaCalculation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("calculation_version", models.PositiveSmallIntegerField()),
                ("term_gpa", models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True)),
                ("cumulative_gpa", models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True)),
                ("term_attempted_credits", models.PositiveIntegerField(default=0)),
                ("term_gpa_credits", models.PositiveIntegerField(default=0)),
                ("term_earned_credits", models.PositiveIntegerField(default=0)),
                ("cumulative_attempted_credits", models.PositiveIntegerField(default=0)),
                ("cumulative_gpa_credits", models.PositiveIntegerField(default=0)),
                ("cumulative_earned_credits", models.PositiveIntegerField(default=0)),
                ("details", models.JSONField(default=dict)),
                ("calculated_at", models.DateTimeField()),
                ("calculated_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_gpa_calculations", to="identity.nexorauser")),
                ("membership", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_gpa_calculations", to="organizations.membership")),
                ("policy", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="calculations", to="academic.academicgpapolicy")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_gpa_calculations", to="organizations.organization")),
                ("term", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="gpa_calculations", to="academic.academicterm")),
            ],
            options={"db_table": "academic_gpa_calculations", "ordering": ("-calculated_at",)},
        ),
        migrations.AddConstraint(
            model_name="academicgpapolicy",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "version"), name="acad_gpa_policy_org_version_unique"),
        ),
        migrations.AddConstraint(
            model_name="academicgpapolicy",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True), ("is_active", True)), fields=("organization",), name="acad_gpa_policy_active_unique"),
        ),
        migrations.AddConstraint(
            model_name="academicgpacalculation",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "membership", "term", "calculation_version"), name="acad_gpa_calc_version_unique"),
        ),
        migrations.AddIndex(
            model_name="academicgpacalculation",
            index=models.Index(fields=["organization", "membership", "term", "-calculated_at"], name="acad_gpa_member_term_idx"),
        ),
    ]
