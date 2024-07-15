# pylint: disable=abstract-method
"""
Assessments Tab Serializers. Represents the relevant assessments with due dates.
"""

import pytz
from datetime import datetime

from rest_framework import serializers
from lms.djangoapps.courseware.date_summary import VerificationDeadlineDate
from lms.djangoapps.course_home_api.serializers import ReadOnlySerializer

class SubsectionScoresSerializer(ReadOnlySerializer):
    """
    Serializer for subsections in section_scores
    """
    assignment_type = serializers.CharField(source='format')
    block_key = serializers.SerializerMethodField()
    has_graded_assignment = serializers.BooleanField(source='graded')
    learner_has_access = serializers.SerializerMethodField()


class SectionScoresSerializer(ReadOnlySerializer):
    """
    Serializer for sections in section_scores
    """
    subsections = SubsectionScoresSerializer(source='sections', many=True)


class CustomGradesSerializer():
    section_scores = SectionScoresSerializer(many=True)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        merged_subsections = []
        for section in representation['section_scores']:
            merged_subsections.extend(section['subsections'])
        return {'subsections': merged_subsections}

        
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

        # Add course name to each date_block
        start_date = ""
        for date_block in representation['date_blocks']:
            date_block['course_name'] = course_name
            if date_block['date_type'] == 'course-start-date':
                start_date = date_block['date']
            date_block['start_date'] = start_date

        return representation

class AssessmentsSerializer(serializers.Serializer):
    """
    Serializer for the Dates Tab
    """
    courses = CourseSummary(many=True)
    section_scores = SectionScoresSerializer(many=True)
    user_timezone = serializers.CharField(allow_null=True)
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        merged_subsections = []
        for section in representation['section_scores']:
            merged_subsections.extend(section['subsections'])
        
        user_timezone = representation.get('user_timezone', 'UTC')
        
        # Collect all date_blocks from all courses
        all_date_blocks = []
        for course in representation['courses']:
            for date_block in course['date_blocks']:
                date_block["is_graded"] = self.check_grade(merged_subsections, date_block['first_component_block_id'])
                # Convert date to user timezone
                # date_block['due_date'] = self.convert_to_user_timezone(date_block['date'], user_timezone)
                # if 'start_date' in date_block:
                #     date_block['start_date'] = self.convert_to_user_timezone(date_block['start_date'], user_timezone)
            all_date_blocks.extend(course['date_blocks'])
        
        # Filter and sort date_blocks by 'date' field
        filtered_sorted_date_blocks = sorted(all_date_blocks, key=lambda x: x['date'])
        
        # Return the final structure
        return {
            'date_blocks': filtered_sorted_date_blocks,
            'user_timezone': representation['user_timezone']
        }
    
        
    def check_grade(merged_subsections, first_component_block_id):
        if merged_subsections and first_component_block_id:
            for each_one in merged_subsections:
                if each_one["block_key"]==first_component_block_id:
                    return has_graded_assignment
    

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
