from .models import ResearchContribution, ResearchOutput, ResearchProject


class ResearchService:
    @staticmethod
    def list_projects(*, user):
        return ResearchProject.objects.filter(owner=user, deleted_at__isnull=True)

    @staticmethod
    def create_project(*, user, **data):
        project = ResearchProject(owner=user, **data)
        project.full_clean()
        project.save()
        return project

    @staticmethod
    def get_project(*, user, project_id):
        return ResearchProject.objects.get(owner=user, id=project_id, deleted_at__isnull=True)

    @staticmethod
    def update_project(*, user, project_id, **data):
        project = ResearchService.get_project(user=user, project_id=project_id)
        for field, value in data.items():
            setattr(project, field, value)
        project.full_clean()
        project.save(update_fields=[*data.keys(), "updated_at"])
        return project

    @staticmethod
    def delete_project(*, user, project_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        project.soft_delete()

    @staticmethod
    def list_outputs(*, user, project_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        return ResearchOutput.objects.filter(project=project, deleted_at__isnull=True)

    @staticmethod
    def create_output(*, user, project_id, **data):
        project = ResearchService.get_project(user=user, project_id=project_id)
        output = ResearchOutput(project=project, **data)
        output.full_clean()
        output.save()
        return output

    @staticmethod
    def list_contributions(*, user, project_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        return ResearchContribution.objects.filter(project=project, deleted_at__isnull=True)

    @staticmethod
    def create_contribution(*, user, project_id, **data):
        project = ResearchService.get_project(user=user, project_id=project_id)
        contribution = ResearchContribution(project=project, **data)
        contribution.full_clean()
        contribution.save()
        return contribution
