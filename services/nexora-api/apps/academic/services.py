from django.db.models import Count, Q

from apps.academic.models import AcademicClassroom, AcademicProgram, AcademicTerm
from apps.organizations.models import Organization


class AcademicService:
    @staticmethod
    def overview(*, organization: Organization) -> dict:
        terms = AcademicTerm.objects.active().filter(organization=organization).order_by("-starts_on", "code")
        programs = AcademicProgram.objects.active().filter(
            organization=organization,
            is_active=True,
        ).order_by("name")
        classrooms = (
            AcademicClassroom.objects.active()
            .filter(organization=organization)
            .select_related("program", "term")
            .annotate(
                active_enrollment_count=Count(
                    "enrollments",
                    filter=Q(
                        enrollments__status="active",
                        enrollments__deleted_at__isnull=True,
                    ),
                )
            )
            .order_by("term__starts_on", "code")
        )
        return {
            "terms": [
                {
                    "id": str(term.id),
                    "code": term.code,
                    "name": term.name,
                    "startsOn": term.starts_on.isoformat(),
                    "endsOn": term.ends_on.isoformat(),
                    "status": term.status,
                }
                for term in terms
            ],
            "programs": [
                {
                    "id": str(program.id),
                    "code": program.code,
                    "name": program.name,
                    "description": program.description,
                }
                for program in programs
            ],
            "classrooms": [
                {
                    "id": str(classroom.id),
                    "code": classroom.code,
                    "name": classroom.name,
                    "program": {"id": str(classroom.program_id), "name": classroom.program.name},
                    "term": {"id": str(classroom.term_id), "code": classroom.term.code},
                    "capacity": classroom.capacity,
                    "status": classroom.status,
                    "activeEnrollmentCount": classroom.active_enrollment_count,
                }
                for classroom in classrooms
            ],
        }
