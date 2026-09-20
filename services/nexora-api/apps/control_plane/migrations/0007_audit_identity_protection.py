from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("control_plane", "0006_audit_event_type_state")]
    operations = [
        migrations.AlterField(model_name="controlplaneauditevent", name="actor", field=models.ForeignKey(blank=True, null=True, on_delete=models.PROTECT, related_name="control_plane_audit_events", to="identity.nexorauser")),
        migrations.AlterField(model_name="controlplaneauditevent", name="target", field=models.ForeignKey(blank=True, null=True, on_delete=models.PROTECT, related_name="control_plane_audit_targets", to="identity.nexorauser")),
    ]
