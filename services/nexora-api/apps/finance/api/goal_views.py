from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import CanReadFinance, CanWriteFinance
from apps.core.api.pagination import CorePageNumberPagination
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NexoraException, PermissionDeniedException
from apps.finance.api.goal_serializers import (
    FinanceGoalContributionCreateSerializer, FinanceGoalContributionSerializer,
    FinanceGoalListQuerySerializer, FinanceGoalProgressSerializer,
    FinanceGoalSerializer, FinanceGoalSummaryQuerySerializer,
    FinanceGoalSummarySerializer, FinanceGoalUpdateSerializer,
)
from apps.finance.selectors.goal_selectors import (
    get_finance_goal_summary, get_goal_by_id, get_goal_contribution_by_id,
    get_goal_progress, list_goal_contributions, list_goals,
)
from apps.finance.services.goal_service import FinanceGoalService
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.organizations.selectors import get_active_membership


class FinanceGoalAPIView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]

    def get_permissions(self):
        permission = CanWriteFinance if self.request.method in {"POST", "PATCH", "PUT", "DELETE"} else CanReadFinance
        return [IsAuthenticated(), permission()]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Finance goal access is denied."))
        return super().handle_exception(exc)

    @staticmethod
    def _error(request, exception: NexoraException):
        return error_response(exception.code, exception.message, details=exception.details,
                              correlation_id=getattr(request, "correlation_id", None), status=exception.status_code)


class FinanceGoalListView(FinanceGoalAPIView):
    def get(self, request, organization_id):
        query = FinanceGoalListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        queryset = list_goals(organization_id=organization_id, **query.validated_data)
        page = CorePageNumberPagination()
        page_results = page.paginate_queryset(queryset, request, view=self)
        if page_results is not None:
            return page.get_paginated_response(FinanceGoalSerializer(page_results, many=True).data)
        return success_response(FinanceGoalSerializer(queryset, many=True).data)

    def post(self, request, organization_id):
        membership = get_active_membership(user=request.user, organization_id=organization_id)
        if membership is None:
            return self._error(request, PermissionDeniedException("Active organization membership is required."))
        serializer = FinanceGoalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = FinanceGoalService.create_goal(organization=membership.organization, **serializer.validated_data)
        return success_response(FinanceGoalSerializer(record).data, status=201)


class FinanceGoalDetailView(FinanceGoalAPIView):
    def _get_record(self, organization_id, goal_id):
        record = get_goal_by_id(organization_id=organization_id, goal_id=goal_id)
        if record is None:
            raise NotFound("Goal not found.")
        return record

    def get(self, request, organization_id, goal_id):
        record = self._get_record(organization_id, goal_id)
        return success_response({
            "goal": FinanceGoalSerializer(record).data,
            "progress": FinanceGoalProgressSerializer(get_goal_progress(goal=record)).data,
        })

    def patch(self, request, organization_id, goal_id):
        record = self._get_record(organization_id, goal_id)
        serializer = FinanceGoalUpdateSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = FinanceGoalService.update_goal(goal_record=record, **serializer.validated_data)
        return success_response(FinanceGoalSerializer(updated).data)

    def delete(self, request, organization_id, goal_id):
        record = self._get_record(organization_id, goal_id)
        return success_response(FinanceGoalSerializer(FinanceGoalService.archive_goal(goal_record=record)).data)


class FinanceGoalSummaryView(FinanceGoalAPIView):
    def get(self, request, organization_id):
        query = FinanceGoalSummaryQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        summary = get_finance_goal_summary(organization_id=organization_id, **query.validated_data)
        return success_response(FinanceGoalSummarySerializer(summary).data)


class FinanceGoalContributionListView(FinanceGoalAPIView):
    def get(self, request, organization_id, goal_id):
        self._get_goal(organization_id, goal_id)
        queryset = list_goal_contributions(organization_id=organization_id, goal_id=goal_id)
        page = CorePageNumberPagination()
        page_results = page.paginate_queryset(queryset, request, view=self)
        if page_results is not None:
            return page.get_paginated_response(FinanceGoalContributionSerializer(page_results, many=True).data)
        return success_response(FinanceGoalContributionSerializer(queryset, many=True).data)

    def post(self, request, organization_id, goal_id):
        membership = get_active_membership(user=request.user, organization_id=organization_id)
        if membership is None:
            return self._error(request, PermissionDeniedException("Active organization membership is required."))
        goal = self._get_goal(organization_id, goal_id)
        serializer = FinanceGoalContributionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = FinanceGoalService.create_contribution(
            organization=membership.organization, goal=goal, **serializer.validated_data
        )
        return success_response(FinanceGoalContributionSerializer(record).data, status=201)

    @staticmethod
    def _get_goal(organization_id, goal_id):
        goal = get_goal_by_id(organization_id=organization_id, goal_id=goal_id)
        if goal is None:
            raise NotFound("Goal not found.")
        return goal


class FinanceGoalContributionDetailView(FinanceGoalAPIView):
    def delete(self, request, organization_id, goal_id, contribution_id):
        contribution = get_goal_contribution_by_id(
            organization_id=organization_id, goal_id=goal_id, contribution_id=contribution_id
        )
        if contribution is None:
            raise NotFound("Contribution not found.")
        return success_response(FinanceGoalContributionSerializer(
            FinanceGoalService.void_contribution(contribution_record=contribution)
        ).data)
