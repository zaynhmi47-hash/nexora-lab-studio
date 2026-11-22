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

    @staticmethod
    def get_output(*, user, project_id, output_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        return ResearchOutput.objects.get(project=project, id=output_id, deleted_at__isnull=True)

    @staticmethod
    def update_output(*, user, project_id, output_id, **data):
        output = ResearchService.get_output(user=user, project_id=project_id, output_id=output_id)
        for field, value in data.items():
            setattr(output, field, value)
        output.full_clean()
        output.save(update_fields=[*data.keys(), "updated_at"])
        return output

    @staticmethod
    def delete_output(*, user, project_id, output_id):
        output = ResearchService.get_output(user=user, project_id=project_id, output_id=output_id)
        output.soft_delete()

    @staticmethod
    def get_contribution(*, user, project_id, contribution_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        return ResearchContribution.objects.get(project=project, id=contribution_id, deleted_at__isnull=True)

    @staticmethod
    def update_contribution(*, user, project_id, contribution_id, **data):
        contribution = ResearchService.get_contribution(
            user=user, project_id=project_id, contribution_id=contribution_id,
        )
        for field, value in data.items():
            setattr(contribution, field, value)
        contribution.full_clean()
        contribution.save(update_fields=[*data.keys(), "updated_at"])
        return contribution

    @staticmethod
    def delete_contribution(*, user, project_id, contribution_id):
        contribution = ResearchService.get_contribution(
            user=user, project_id=project_id, contribution_id=contribution_id,
        )
        contribution.soft_delete()
