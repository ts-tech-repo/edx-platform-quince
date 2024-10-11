(function(define) {
    'use strict';

    define([
        'jquery',
        'edx-ui-toolkit/js/utils/date-utils',
        'edx-ui-toolkit/js/utils/string-utils'
    ], function($, DateUtils, StringUtils) {
        var DateUtilFactory;
        var localizedTime;
        var stringHandler;
        var displayDatetime;
        var isValid;
        var transform;
        var dueDateFormat;
        var dateFormat;

        dueDateFormat = Object.freeze({
            '%Y-%d-%m': 'YYYY, D MMM HH[:]mm z', // example: 2018, 01 Jan 15:30 UTC
            '%m-%d-%Y': 'MMM D, YYYY HH[:]mm z', // example: Jan 01, 2018 15:30 UTC
            '%d-%m-%Y': 'D MMM YYYY HH[:]mm z', // example: 01 Jan, 2018 15:30 UTC
            '%Y-%m-%d': 'YYYY, MMM D HH[:]mm z' // example: 2018, Jan 01 15:30 UTC
        });

        transform = function(iterationKey) {
            var context;
            $(iterationKey).each(function() {
                if (isValid($(this).data('datetime'))) {
                    dateFormat = DateUtils.dateFormatEnum[$(this).data('format')];
                    if (typeof dateFormat === 'undefined') {
                        dateFormat = dueDateFormat[$(this).data('format')];
                    }
                    context = {
                        datetime: $(this).data('datetime'),
                        timezone: $(this).data('timezone'),
                        language: $(this).data('language'),
                        format: dateFormat
                    };
                    displayDatetime = stringHandler(
                        localizedTime(context),
                        $(this).data('string'),
                        $(this).data('datetoken')
                    );
                    $(this).text(displayDatetime);
                } else {
                    displayDatetime = stringHandler(
                        $(this).data('string')
                    );
                    $(this).text(displayDatetime);
                }
            });
        };

        localizedTime = function(context) {
            const utcDate = new Date(context.datetime);
            const options = {
                timeZone: context.timezone,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false, // Use 24-hour format
                timeZoneName: 'short'
            };

            // Format the date based on the user's timezone
            const formattedDate = utcDate.toLocaleString(context.language, options);

            // Replace 'GMT' in the output with the required format
            const timezone = context.timezone ? context.timezone : 'UTC';
            const timezoneOffset = utcDate.getTimezoneOffset() / -60; // Get offset in hours
            const formattedTimezone = timezoneOffset >= 0 ? `GMT+${timezoneOffset}` : `GMT${timezoneOffset}`;

            return `${formattedDate} ${formattedTimezone}`;
        };

        stringHandler = function(localTimeString, containerString, token) {
            var returnString;
            var interpolateDict = {};
            var dateToken;
            if (isValid(token)) {
                dateToken = token;
            } else {
                dateToken = 'date';
            }
            interpolateDict[dateToken] = localTimeString;

            if (isValid(containerString)) {
                returnString = StringUtils.interpolate(
                    containerString,
                    interpolateDict
                );
            } else {
                returnString = localTimeString;
            }
            return returnString;
        };

        isValid = function(candidateVariable) {
            return candidateVariable !== undefined
                && candidateVariable !== ''
                && candidateVariable !== 'Invalid date'
                && candidateVariable !== 'None';
        };

        DateUtilFactory = {
            transform: transform,
            stringHandler: stringHandler
        };
        return DateUtilFactory;
    });
}).call(this, define || RequireJS.define);
