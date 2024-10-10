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
            '%Y-%d-%m': 'YYYY, D MMM HH[:]mm [GMT]Z', // example: 2018, 01 Jan 15:30 GMT-4
            '%m-%d-%Y': 'MMM D, YYYY HH[:]mm [GMT]Z', // example: Jan 01, 2018 15:30 GMT-4
            '%d-%m-%Y': 'D MMM YYYY HH[:]mm [GMT]Z', // example: 01 Jan, 2018 15:30 GMT-4
            '%Y-%m-%d': 'YYYY, MMM D HH[:]mm [GMT]Z' // example: 2018, Jan 01 15:30 GMT-4
        });

        transform = function (iterationKey) {
            var context;
            $(iterationKey).each(function () {
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
            return convertTimezoneFormat(localized, context.timezone);
        };

        function convertTimezoneFormat(datetimeString, timezone) {
            // Convert UTC offsets directly to GMT format
            var gmtFormatted = datetimeString.replace(
                /([+-]\d{2})(?::(\d{2}))?/,
                function(match, p1, p2) {
                    // Convert to 'GMT+1', 'GMT-10', etc.
                    return 'GMT' + p1;
                }
            );

            // If timezone is not a numeric offset, append it as is
            if (!/GMT/.test(gmtFormatted) && timezone) {
                gmtFormatted = gmtFormatted.replace(/GMT.*$/, timezone);
            }

            return gmtFormatted;
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
