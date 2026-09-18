import uuid
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]
    operations = [migrations.CreateModel(
        name="ZakatCalculation",
        fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("assets", models.DecimalField(decimal_places=2, max_digits=18)),
            ("debts", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
            ("nisab", models.DecimalField(decimal_places=2, max_digits=18)),
            ("rate", models.DecimalField(decimal_places=4, default=0.025, max_digits=5)),
            ("zakatable_amount", models.DecimalField(decimal_places=2, max_digits=18)),
            ("zakat_amount", models.DecimalField(decimal_places=2, max_digits=18)),
            ("currency", models.CharField(default="IDR", max_length=3)),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="zakat_calculations", to="identity.nexorauser")),
        ],
        options={"db_table": "zakat_calculations", "ordering": ("-created_at",)},
    )]
