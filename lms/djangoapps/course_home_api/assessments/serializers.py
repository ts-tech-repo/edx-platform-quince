# pylint: disable=abstract-method
"""
Assessments Tab Serializers. Represents the relevant assessments with due dates.
"""


from rest_framework import serializers


class AssessmentsSerializer(serializers.Serializer):
    """
    Serializer for Assessmentes Objects.
    """
    assignment_type = serializers.CharField(default=None)
    complete = serializers.BooleanField(allow_null=True)
    date = serializers.DateTimeField()
    date_type = serializers.CharField()
    description = serializers.CharField()
    link = serializers.SerializerMethodField()
    link_text = serializers.CharField()
    title = serializers.CharField()

   
    def get_link(self, block):
        if block.link:
            return block.link
        return ''

    def get_first_component_block_id(self, block):
        return getattr(block, 'first_component_block_id', '')
