from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("access", "0001_initial"),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="membership",
            name="role",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="memberships",
                to="access.role",
            ),
        ),
    ]
