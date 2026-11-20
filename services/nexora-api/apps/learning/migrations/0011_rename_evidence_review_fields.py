from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0010_learning_evidence_sharing"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="learningevidence",
            name="learn_evidence_review_audit_ck",
        ),
        migrations.RenameField(
            model_name="learningevidence",
            old_name="verified_by",
            new_name="reviewed_by",
        ),
        migrations.RenameField(
            model_name="learningevidence",
            old_name="verified_at",
            new_name="reviewed_at",
        ),
        migrations.AddConstraint(
            model_name="learningevidence",
            constraint=models.CheckConstraint(
                condition=(
                    ~models.Q(("status__in", ("verified", "rejected")))
                    | (models.Q(("reviewed_by__isnull", False)) & models.Q(("reviewed_at__isnull", False)))
                ),
                name="learn_evidence_review_audit_ck",
            ),
        ),
    ]
