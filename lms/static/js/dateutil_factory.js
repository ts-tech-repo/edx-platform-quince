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
            '%Y-%d-%m': 'YYYY, D MMM HH[:]mm [GMT]Z',
            '%m-%d-%Y': 'MMM D, YYYY HH[:]mm [GMT]Z',
            '%d-%m-%Y': 'D MMM YYYY HH[:]mm [GMT]Z',
            '%Y-%m-%d': 'YYYY, MMM D HH[:]mm [GMT]Z'
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
            var localized = DateUtils.localize(context);

            // Get the formatted date string and append the proper timezone format
            var formattedDate = formatDateWithTimezone(localized, context.timezone);
            return formattedDate;
        };

        function formatDateWithTimezone(datetimeString, timezone) {
            var dateObj = new Date(datetimeString);
            var options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
            var formattedDate = dateObj.toLocaleString('en-US', options);
            
            var gmtString = calculateGMTOffset(timezone);
            return formattedDate + ' ' + gmtString;
        }

        function calculateGMTOffset(timezone) {
            var dateObj = new Date();
            var utcOffset = dateObj.toLocaleString("en-US", {timeZone: timezone, timeZoneName: 'short'}).split(' ')[2];
            var offsetHours = utcOffset.includes('-') ? utcOffset.split('-')[1] : utcOffset.split('+')[1];
            var sign = utcOffset.includes('-') ? 'GMT-' : 'GMT+';

            var offset = parseInt(offsetHours) * (utcOffset.includes('D') ? 1 : 1); 
            return sign + Math.abs(offset);
        }

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
