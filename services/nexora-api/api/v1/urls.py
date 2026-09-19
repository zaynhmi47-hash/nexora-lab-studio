from django.urls import include
from django.urls import path

from api.v1.app_state import CurrentAppStateView
from api.v1.health import HealthView, LivenessView, ReadinessView
from api.v1.identity import CurrentIdentityView
from apps.finance.api.reporting_views import FinanceCategoryBreakdownView
from apps.finance.api.summary_views import FinanceSummaryView
from apps.finance.api.comparison_views import FinancePeriodComparisonView
from apps.finance.api.profit_loss_views import FinanceProfitLossView
from apps.finance.api.cash_flow_views import FinanceCashFlowView
from apps.finance.api.insights_views import FinanceInsightsView
from apps.finance.api.trend_views import FinanceTrendView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("health/live/", LivenessView.as_view(), name="health-live"),
    path("health/ready/", ReadinessView.as_view(), name="health-ready"),
    path("identity/me/", CurrentIdentityView.as_view(), name="identity-me"),
    path("app-state/", CurrentAppStateView.as_view(), name="app-state"),
    path("learning/", include("apps.learning.urls")),
    path("quran/", include("apps.quran.urls")),
    path("dhikr/", include("apps.dhikr.urls")),
    path("umrah/", include("apps.umrah.urls")),
    path("profile/", include("apps.profile.urls")),
    path("knowledge/", include("apps.knowledge.urls")),
    path("tajwid/", include("apps.tajwid.urls")),
    path("arabic/", include("apps.arabic.urls")),
    path("fasting/", include("apps.fasting.urls")),
    path("dua/", include("apps.dua.urls")),
    path("calendar/", include("apps.calendar.urls")),
    path("zakat/", include("apps.zakat.urls")),
    path("reminders/", include("apps.reminders.urls")),
    path("places/", include("apps.places.urls")),
    path("organizations/", include("api.v1.urls_organizations")),
    path("products/", include("apps.products.api.urls")),
    path("products/", include("apps.capabilities.api.urls_products")),
    path("capabilities/", include("apps.capabilities.api.urls")),
    path("organizations/<uuid:organization_id>/finance/transactions/", include("apps.finance.api.urls")),
    path("organizations/<uuid:organization_id>/finance/summary/", FinanceSummaryView.as_view(), name="finance-summary"),
    path(
        "organizations/<uuid:organization_id>/finance/reporting/category-breakdown/",
        FinanceCategoryBreakdownView.as_view(),
        name="finance-category-breakdown",
    ),
    path(
        "organizations/<uuid:organization_id>/finance/reporting/trend/",
        FinanceTrendView.as_view(),
        name="finance-trend",
    ),
    path(
        "organizations/<uuid:organization_id>/finance/reporting/comparison/",
        FinancePeriodComparisonView.as_view(),
        name="finance-period-comparison",
    ),
    path(
        "organizations/<uuid:organization_id>/finance/reporting/profit-loss/",
        FinanceProfitLossView.as_view(),
        name="finance-profit-loss",
    ),
    path(
        "organizations/<uuid:organization_id>/finance/reporting/cash-flow/",
        FinanceCashFlowView.as_view(),
        name="finance-cash-flow",
    ),
    path(
        "organizations/<uuid:organization_id>/finance/reporting/insights/",
        FinanceInsightsView.as_view(),
        name="finance-insights",
    ),
]
