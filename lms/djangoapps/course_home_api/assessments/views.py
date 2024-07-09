"""
Assessments Tab Views
"""

from edx_django_utils import monitoring as monitoring_utils
from edx_rest_framework_extensions.auth.jwt.authentication import JwtAuthentication
from edx_rest_framework_extensions.auth.session.authentication import SessionAuthenticationAllowInactiveUser
from opaque_keys.edx.keys import CourseKey
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import AnonymousUser, User

from common.djangoapps.student.models import CourseEnrollment
from lms.djangoapps.course_goals.models import UserActivity
from lms.djangoapps.course_home_api.assessments.serializers import AssessmentsSerializer
from lms.djangoapps.course_home_api.utils import get_course_or_403
from lms.djangoapps.courseware.access import has_access
from lms.djangoapps.courseware.context_processor import user_timezone_locale_prefs
from lms.djangoapps.courseware.courses import get_course_date_blocks
from lms.djangoapps.courseware.date_summary import TodaysDate
from lms.djangoapps.courseware.masquerade import setup_masquerade
from openedx.core.lib.api.authentication import BearerAuthenticationAllowInactiveUser
from openedx.features.content_type_gating.models import ContentTypeGatingConfig
from openedx.core.djangoapps.enrollments.data import get_course_enrollments


class AssessmentsTabView(RetrieveAPIView):
    """
    **Use Cases**

        Request details for the Dates Tab

    **Example Requests**

        GET api/course_home/v1/assessments

    **Response Values**

        Body consists of the following fields:

        course_date_blocks: List of serialized DateSummary objects. Each serialization has the following fields:
            complete: (bool) Meant to only be used by assignments. Indicates completeness for an
                assignment.
            date: (datetime) The date time corresponding for the event
            date_type: (str) The type of date (ex. course-start-date, assignment-due-date, etc.)
            description: (str) The description for the date event
            learner_has_access: (bool) Indicates if the learner has access to the date event
            link: (str) An absolute link to content related to the date event
                (ex. verified link or link to assignment)
            title: (str) The title of the date event
        dates_banner_info: (obj)
            content_type_gating_enabled: (bool) Whether content type gating is enabled for this enrollment.
            missed_deadlines: (bool) Indicates whether the user missed any graded content deadlines
            missed_gated_content: (bool) Indicates whether the user missed gated content
            verified_upgrade_link: (str) The link for upgrading to the Verified track in a course
        has_ended: (bool) Indicates whether course has ended
        learner_is_full_access: (bool) Indicates if the user is verified in the course
        user_timezone: (str) The user's preferred timezone

    **Returns**

        * 200 on success with above fields.
        * 401 if the user is not authenticated.
        * 403 if the user does not have access to the course.
        * 404 if the course is not available or cannot be seen.
    """

    authentication_classes = (
        JwtAuthentication,
        BearerAuthenticationAllowInactiveUser,
        SessionAuthenticationAllowInactiveUser,
    )
    permission_classes = (IsAuthenticated,)
    serializer_class = AssessmentsSerializer

    def get(self, request, *args, **kwargs):
        user = User.objects.get(email = request.user.email)
        user_courses = get_course_enrollments(user.username)
        response_data = {"courses":[]}
        for i, user_course in enumerate(user_courses):
            course_key_string = user_course["course_details"]["course_id"]
            course_key = CourseKey.from_string(course_key_string)
            # is_staff = bool(has_access(request.user, 'staff', course_key))
            course = get_course_or_403(request.user, 'load', course_key, check_if_enrolled=False)

            if CourseEnrollment.is_enrolled(request.user, course_key):
                blocks = get_course_date_blocks(course, request.user, request, include_access=True, include_past_dates=True)
                response_data["courses"].append({
                    'details':course_key_string,
                    'date_blocks': [block for block in blocks if not isinstance(block, TodaysDate)]
                })

        # User locale settings
        user_timezone_locale = user_timezone_locale_prefs(request)
        response_data['user_timezone']=user_timezone_locale['user_timezone']
        context = self.get_serializer_context()
        serializer = self.get_serializer_class()(response_data, context=context)
        return Response(response_data)
