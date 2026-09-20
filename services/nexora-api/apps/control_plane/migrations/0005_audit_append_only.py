from django.db import migrations


def install_append_only_guards(apps, schema_editor):
    table = "control_plane_audit_events"
    if schema_editor.connection.vendor == "sqlite":
        schema_editor.execute(
            f"""CREATE TRIGGER IF NOT EXISTS control_plane_audit_no_update
            BEFORE UPDATE ON {table}
            BEGIN
                SELECT RAISE(ABORT, 'Control Plane audit events are immutable');
            END;"""
        )
        schema_editor.execute(
            f"""CREATE TRIGGER IF NOT EXISTS control_plane_audit_no_delete
            BEFORE DELETE ON {table}
            BEGIN
                SELECT RAISE(ABORT, 'Control Plane audit events cannot be deleted');
            END;"""
        )
    elif schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            """CREATE OR REPLACE FUNCTION control_plane_audit_immutable()
            RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'Control Plane audit events are immutable';
            END;
            $$ LANGUAGE plpgsql;"""
        )
        schema_editor.execute(
            f"""CREATE TRIGGER control_plane_audit_no_update
            BEFORE UPDATE ON {table}
            FOR EACH ROW EXECUTE FUNCTION control_plane_audit_immutable();"""
        )
        schema_editor.execute(
            f"""CREATE TRIGGER control_plane_audit_no_delete
            BEFORE DELETE ON {table}
            FOR EACH ROW EXECUTE FUNCTION control_plane_audit_immutable();"""
        )


def remove_append_only_guards(apps, schema_editor):
    table = "control_plane_audit_events"
    if schema_editor.connection.vendor == "sqlite":
        schema_editor.execute("DROP TRIGGER IF EXISTS control_plane_audit_no_update;")
        schema_editor.execute("DROP TRIGGER IF EXISTS control_plane_audit_no_delete;")
    elif schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(f"DROP TRIGGER IF EXISTS control_plane_audit_no_update ON {table};")
        schema_editor.execute(f"DROP TRIGGER IF EXISTS control_plane_audit_no_delete ON {table};")
        schema_editor.execute("DROP FUNCTION IF EXISTS control_plane_audit_immutable();")


class Migration(migrations.Migration):
    dependencies = [("control_plane", "0004_controlplaneauditevent")]
    operations = [migrations.RunPython(install_append_only_guards, remove_append_only_guards)]
