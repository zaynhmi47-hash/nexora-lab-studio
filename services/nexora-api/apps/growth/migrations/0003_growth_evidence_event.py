import uuid

import django.db.models.deletion
from django.db import migrations, models


def install_postgresql_immutability_trigger(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute("""
        CREATE OR REPLACE FUNCTION growth_evidence_event_immutable()
        RETURNS trigger AS $growth$
        BEGIN
            IF pg_trigger_depth() > 1 THEN
                RETURN OLD;
            END IF;
            RAISE EXCEPTION 'growth evidence events are append-only';
        END;
        $growth$ LANGUAGE plpgsql;
    """)
    schema_editor.execute("""
        CREATE TRIGGER growth_evidence_event_no_mutation
        BEFORE UPDATE OR DELETE ON growth_evidence_events
        FOR EACH ROW EXECUTE FUNCTION growth_evidence_event_immutable();
    """)


def remove_postgresql_immutability_trigger(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute("DROP TRIGGER IF EXISTS growth_evidence_event_no_mutation ON growth_evidence_events;")
    schema_editor.execute("DROP FUNCTION IF EXISTS growth_evidence_event_immutable();")


class Migration(migrations.Migration):
    dependencies = [
        ("growth", "0002_growth_habits"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="GrowthEvidenceEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("event_type", models.CharField(choices=[
                    ("goal.created", "Goal created"),
                    ("goal.status_changed", "Goal status changed"),
                    ("habit.created", "Habit created"),
                    ("habit.check_in_recorded", "Habit check-in recorded"),
                    ("habit.check_in_changed", "Habit check-in changed"),
                ], max_length=40)),
                ("subject_type", models.CharField(max_length=32)),
                ("subject_id", models.CharField(max_length=64)),
                ("event_key", models.CharField(max_length=180, unique=True)),
                ("occurred_at", models.DateTimeField()),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="growth_evidence_events",
                    to="identity.nexorauser",
                )),
            ],
            options={
                "db_table": "growth_evidence_events",
                "ordering": ("-occurred_at", "-id"),
            },
        ),
        migrations.AddIndex(
            model_name="growthevidenceevent",
            index=models.Index(fields=["user", "-occurred_at"], name="growth_event_user_time_idx"),
        ),
        migrations.AddIndex(
            model_name="growthevidenceevent",
            index=models.Index(fields=["subject_type", "subject_id"], name="growth_event_subject_idx"),
        ),
        migrations.RunPython(
            install_postgresql_immutability_trigger,
            remove_postgresql_immutability_trigger,
        ),
    ]
