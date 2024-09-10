"""
Extra utilities for waffle: most classes are defined in edx_toggles.toggles (https://edx-toggles.readthedocs.io/), but
we keep here some extra classes for usage within edx-platform. These classes cover course override use cases.
"""
import logging

from edx_toggles.toggles import WaffleFlag
from opaque_keys.edx.keys import CourseKey

log = logging.getLogger(__name__)


class CourseWaffleFlag(WaffleFlag):
    """
    Represents a single waffle flag that can be forced on/off for a course.

    This class should be used instead of WaffleFlag when in the context of a course.
    This class will also respect any org-level overrides, though course-level overrides will take precedence.

    Uses a cached waffle namespace.

    Usage:

       SOME_COURSE_FLAG = CourseWaffleFlag('my_namespace.some_course_feature', __name__, log_prefix='')

    And then we can check this flag in code with::

        SOME_COURSE_FLAG.is_enabled(course_key)

    To configure a course-level override, go to Django Admin "waffle_utils" -> "Waffle flag course overrides".

        Waffle flag: Set this to the flag name (e.g. my_namespace.some_course_feature).
        Course id: Set this to the course id (e.g. course-v1:edx+100+Demo)
        Override choice: (Force on/Force off). "Force on" will enable the waffle flag for all users in a course,
            overriding any behavior configured on the waffle flag itself. "Force off" will disable the waffle flag
            for all users in a course, overriding any behavior configured on the waffle flag itself. Requires
            "Enabled" (see below) to apply.
        Enabled: Must be marked as "enabled" in order for the override to be applied. These settings can't be
            deleted, so instead, you need to add another disabled override entry to disable the override.

    To configure an org-level override, go to Django Admin "waffle_utils" -> "Waffle flag org overrides".

        Waffle flag: Set this to the flag name (e.g. my_namespace.some_course_feature).
        Org name: Set this to the organization name (e.g. edx)
        Override choice: (Force on/Force off). "Force on" will enable the waffle flag for all users in an org's courses,
            overriding any behavior configured on the waffle flag itself. "Force off" will disable the waffle flag
            for all users in a org's courses, overriding any behavior configured on the waffle flag itself. Requires
            "Enabled" (see below) to apply.
        Enabled: Must be marked as "enabled" in order for the override to be applied. These settings can't be
            deleted, so instead, you need to add another disabled override entry to disable the override.
    """
    def _get_course_override_value(self, course_key):
        """
        Check whether the course flag was overriden.

        Returns True/False if the flag was forced on or off for the provided course.
        Returns None if the flag was not overridden.

        Note: Has side effect of caching the override value.

        Arguments:
            course_key (CourseKey): The course to check for override before checking waffle.
        """
        # Import is placed here to avoid model import at project startup.
        from .models import WaffleFlagCourseOverrideModel, WaffleFlagOrgOverrideModel

        course_cache_key = f"{self.name}.cwaffle.{str(course_key)}"
        course_override = self.cached_flags().get(course_cache_key)
        log.info(f"course_override:{course_override},1111'")
        if course_override is None:
            course_override = WaffleFlagCourseOverrideModel.override_value(
                self.name, course_key
            )
            log.info(f"course_override:{course_override},2222'")
            self.cached_flags()[course_cache_key] = course_override

        if course_override == WaffleFlagCourseOverrideModel.ALL_CHOICES.on:
            log.info('111111')
            return True
        if course_override == WaffleFlagCourseOverrideModel.ALL_CHOICES.off:
            log.info('22222222')
            return False

        # Since no course-specific override was found, fall back to checking at the org-level.
        if course_key:
            org = course_key.org
            org_cache_key = f"{self.name}.owaffle.{org}"
            org_override = self.cached_flags().get(org_cache_key)
            log.info(f"org_override:{org_override}11111")
            if org_override is None:
                org_override = WaffleFlagOrgOverrideModel.override_value(
                    self.name, org
                )
                log.info(f"org_override:{org_override}222222")

                self.cached_flags()[org_cache_key] = org_override

            if org_override == WaffleFlagOrgOverrideModel.ALL_CHOICES.on:
                log.info('33333333')
                return True
            if org_override == WaffleFlagOrgOverrideModel.ALL_CHOICES.off:
                log.info('444444444')
                return False

        return None

    def is_enabled(self, course_key=None):  # pylint: disable=arguments-differ
        """
        Returns whether or not the flag is enabled within the context of a given course.

        Arguments:
            course_key (Optional[CourseKey]): The course to check for override before
                checking waffle. If omitted, check whether the flag is enabled
                outside the context of any course.
        """
        if course_key:
            assert isinstance(
                course_key, CourseKey
            ), "Provided course_key '{}' is not instance of CourseKey.".format(
                course_key
            )
        is_enabled_for_course = self._get_course_override_value(course_key)
        log.info(is_enabled_for_course)
        if is_enabled_for_course is not None:
            log.info("enabled == ------ Not None")
            return is_enabled_for_course
        global_is_enabled = super().is_enabled()
        log.info(f"global_is_enabled:{global_is_enabled}")
        return super().is_enabled()
