# pylint: disable=abstract-method
"""
Assessments Tab Serializers. Represents the relevant assessments with due dates.
"""


from rest_framework import serializers
from lms.djangoapps.courseware.date_summary import VerificationDeadlineDate


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
        for date_block in representation['date_blocks']:
            date_block['course_name'] = course_name

        return representation

class AssessmentsSerializer(serializers.Serializer):
    """
    Serializer for the Dates Tab
    """
    courses = CourseSummary(many=True)
    user_timezone = serializers.CharField()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Collect all date_blocks from all courses
        all_date_blocks = []
        for course in representation['courses']:
            all_date_blocks.extend(course['date_blocks'])
        
        # Filter and sort date_blocks by 'date' field
        filtered_sorted_date_blocks = sorted(all_date_blocks, key=lambda x: x['date'])
        
        # Return the final structure
        return {
            'date_blocks': filtered_sorted_date_blocks,
            'user_timezone': representation['user_timezone']
        }
