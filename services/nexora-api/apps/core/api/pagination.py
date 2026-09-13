from rest_framework.pagination import PageNumberPagination

from apps.core.api.response import success_response
from apps.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE


class CorePageNumberPagination(PageNumberPagination):
    page_size = DEFAULT_PAGE_SIZE
    page_size_query_param = "page_size"
    max_page_size = MAX_PAGE_SIZE

    def get_paginated_response(self, data):
        page_size = self.page.paginator.per_page
        return success_response(
            data,
            meta={
                "pagination": {
                    "page": self.page.number,
                    "page_size": page_size,
                    "total": self.page.paginator.count,
                    "total_pages": self.page.paginator.num_pages,
                }
            },
        )
