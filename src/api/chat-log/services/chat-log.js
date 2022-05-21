'use strict';

/**
 * chat-log service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::chat-log.chat-log');
