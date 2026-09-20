from django.db import migrations, models


def create_bootstrap_state(apps, schema_editor):
    State = apps.get_model("control_plane", "ControlPlaneBootstrapState")
    State.objects.get_or_create(pk=1, defaults={"locked": False})


class Migration(migrations.Migration):

    dependencies = [
        ("control_plane", "0002_controlplanincipal_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="ControlPlaneBootstrapState",
            fields=[
                (
                    "id",
                    models.PositiveSmallIntegerField(
                        default=1,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("locked", models.BooleanField(default=False)),
                ("locked_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={"db_table": "control_plane_bootstrap_state"},
        ),
        migrations.RunPython(create_bootstrap_state, migrations.RunPython.noop),
    ]
