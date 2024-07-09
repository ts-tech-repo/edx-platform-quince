# pylint: disable=abstract-method
"""
Assessments Tab Serializers. Represents the relevant assessments with due dates.
"""


from rest_framework import serializers


class AssessmentsSerializerDatesSummary(serializers.Serializer):
    """
    Serializer for Assessmentes Objects.
    """
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
    details = serializers.CharField()
    date_blocks = AssessmentsSerializerDatesSummary(many=True)   


class AssessmentsSerializer():
    """
    Serializer for the Dates Tab
    """
    courses = CourseSummary(many=True)
    user_timezone = serializers.CharField()
