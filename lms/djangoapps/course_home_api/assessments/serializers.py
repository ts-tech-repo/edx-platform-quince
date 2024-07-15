# pylint: disable=abstract-method
"""
Assessments Tab Serializers. Represents the relevant assessments with due dates.
"""


from datetime import datetime

import pytz
from lms.djangoapps.courseware.models import StudentModule
from rest_framework import serializers
from lms.djangoapps.courseware.date_summary import VerificationDeadlineDate
import logging
from lms.djangoapps.course_home_api.serializers import ReadOnlySerializer

log = logging.getLogger(__name__)

class SubsectionScoresSerializer(ReadOnlySerializer):
    """
    Serializer for subsections in section_scores
    """
    assignment_type = serializers.CharField(source='format')
    block_key = serializers.SerializerMethodField()
    has_graded_assignment = serializers.BooleanField(source='graded')

    def get_override(self, subsection):
        """Proctoring or grading score override"""
        if subsection.override is None:
            return None
        else:
            return {
                "system": subsection.override.system,
                "reason": subsection.override.override_reason,
            }

    def get_block_key(self, subsection):
        return str(subsection.location)

    def get_problem_scores(self, subsection):
        """Problem scores for this subsection"""
        problem_scores = [
            {
                'earned': score.earned,
                'possible': score.possible,
            }
            for score in subsection.problem_scores.values()
        ]
        return problem_scores

    def get_url(self, subsection):
        """
        Returns the URL for the subsection while taking into account if the course team has
        marked the subsection's visibility as hide after due.
        """
        hide_url_date = subsection.end if subsection.self_paced else subsection.due
        if (not self.context['staff_access'] and subsection.hide_after_due and hide_url_date
                and datetime.now(pytz.UTC) > hide_url_date):
            return None

        relative_path = reverse('jump_to', args=[self.context['course_key'], subsection.location])
        request = self.context['request']
        return request.build_absolute_uri(relative_path)

    def get_show_grades(self, subsection):
        return subsection.show_grades(self.context['staff_access'])

merged_subsections = []
class SubsectionScoresSerializerOuter(ReadOnlySerializer):
    """
    Serializer for sections in subsections
    """
    subsections = SubsectionScoresSerializer(many=True)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        for course in representation['subsections']:
            merged_subsections.extend(course)

        return representation

class SectionScoresSerializer(ReadOnlySerializer):
    """
    Serializer for sections in section_scores
    """
    section_scores = SubsectionScoresSerializerOuter()

class AssessmentsSerializerDatesSummary(serializers.Serializer):
    """
    Serializer for Assessmentes Objects.
    """
    course_name = serializers.CharField(default=None) 
    assignment_type = serializers.CharField(default=None)
    complete = serializers.BooleanField(allow_null=True)
    date = serializers.DateTimeField()
    date_type = serializers.CharField()
    description = serializers.CharField()
    learner_has_access = serializers.SerializerMethodField()
    link = serializers.SerializerMethodField()
    link_text = serializers.CharField()
    title = serializers.CharField()
    extra_info = serializers.CharField()
    first_component_block_id = serializers.SerializerMethodField()

    def get_learner_has_access(self, block):
        """Whether the learner is blocked (gated) from this content or not"""
        if isinstance(block, VerificationDeadlineDate):
            # This date block isn't an assignment, so doesn't have contains_gated_content set for it
            return self.context.get('learner_is_full_access', False)

        return not getattr(block, 'contains_gated_content', False)

    def get_link(self, block):
        if block.link:
            return block.link
        return ''

    def get_first_component_block_id(self, block):
        return getattr(block, 'first_component_block_id', '')


class CourseSummary(serializers.Serializer):
    """
    Serializer for Assessmentes Objects.
    """
    name = serializers.CharField()
    date_blocks = AssessmentsSerializerDatesSummary(many=True)   
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        course_name = representation.pop('name')  # Get and remove the course name

        log.info(representation)
        # Add course name to each date_block
        start_date = ""
        for date_block in representation['date_blocks']:
            date_block['course_name'] = course_name
            date_block["is_graded"] = self.check_grade(merged_subsections, date_block['first_component_block_id'])
            if date_block['date_type'] == 'course-start-date':
                start_date = date_block['date']
            date_block['start_date'] = start_date
        return representation
    
    def check_grade(self, merged_subsections, first_component_block_id):
        if merged_subsections and first_component_block_id:
            for each_one in merged_subsections:
                log.info(each_one["has_graded_assignment"])
                if each_one["block_key"]==first_component_block_id:
                    return "Graded" if each_one["has_graded_assignment"] else "Under Review"
        return "-"

class AssessmentsSerializer(serializers.Serializer):
    """
    Serializer for the Dates Tab
    """
    courses = CourseSummary(many=True)
    user_timezone = serializers.CharField()
    student_id = serializers.CharField()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        user_timezone = representation["user_timezone"]
        # Collect all date_blocks from all courses
        all_date_blocks = []
        for course in representation['courses']:
            for date_block in course["date_blocks"]:
                # if 'start_date' in date_block:
                #     date_block['start_date'] = self.convert_to_user_timezone(date_block['start_date'], user_timezone)
                date_block["submission_status"] = "-"
                if date_block["first_component_block_id"]:
                    student_module_info = StudentModule.objects.filter(student_id = representation["student_id"], module_state_key = date_block["first_component_block_id"])
                    if not student_module_info:
                        date_block["submission_status"] = "Not Submitted"
                    else:
                        date_block["submission_status"] = "Submitted"
            all_date_blocks.extend(course["date_blocks"])
        
        # Filter and sort date_blocks by 'date' field
        filtered_sorted_date_blocks = sorted(all_date_blocks, key=lambda x: x['date'])
        
        # Return the final structure
        return {
            'date_blocks': filtered_sorted_date_blocks,
            'user_timezone': representation['user_timezone']
        }
    
    def convert_to_user_timezone(self, date, user_timezone):
        if date:
            # Parsing the datetime string to datetime object
            utc_time = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")

            # Assuming user's timezone is Asia/Kolkata
            user_timezone = pytz.timezone(user_timezone)

            # Converting the UTC time to user's timezone
            user_time = utc_time.replace(tzinfo=pytz.utc).astimezone(user_timezone)

            # Formatting the datetime as "Jun 27, 2024 05:30 AM"
            formatted_user_time = user_time.strftime("%b %d, %Y %I:%M %p")
            return formatted_user_time
        return date