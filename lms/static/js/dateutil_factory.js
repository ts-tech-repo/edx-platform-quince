/**
 *
 * A helper function to utilize DateUtils quickly in display templates.
 *
 * @param: {string} data-datetime A pre-localized datetime string, assumed to be in UTC.
 * @param: {string} lang The user's preferred language.
 * @param: {string} data-timezone (optional) A user-set timezone preference.
 * @param: {object} data-format (optional) a format constant as defined in DataUtil.dateFormatEnum.
 * @param: {string} data-string (optional) a string for parsing through StringUtils after localizing
 * datetime
 *
 * @return: {string} a user-time, localized, formatted datetime string
 *
 */

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
            '%Y-%d-%m': 'YYYY, D MMM HH[:]mm', // example: 2018, 01 Jan 15:30
            '%m-%d-%Y': 'MMM D, YYYY HH[:]mm', // example: Jan 01, 2018 15:30
            '%d-%m-%Y': 'D MMM YYYY HH[:]mm', // example: 01 Jan, 2018 15:30
            '%Y-%m-%d': 'YYYY, MMM D HH[:]mm' // example: 2018, Jan 01 15:30
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

        localizedTime = function (context) {
            var localizedDate = DateUtils.localize(context);
            var timezoneOffset = DateUtils.getTimezoneOffset(context.timezone);
            var formattedTimezone;

            if (timezoneOffset === 0) {
                formattedTimezone = 'GMT';
            } else {
                var offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
                var offsetMinutes = Math.abs(timezoneOffset) % 60;
                var sign = timezoneOffset > 0 ? '+' : '-';
                formattedTimezone = 'GMT' + sign + offsetHours;

                if (offsetMinutes > 0) {
                    formattedTimezone += ':' + String(offsetMinutes).padStart(2, '0');
                }
            }
            return localizedDate.replace('z', formattedTimezone);
        };

        stringHandler = function (localTimeString, containerString, token) {
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