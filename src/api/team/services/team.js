'use strict';

/**
 * team service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::team.team', ({strapi}) =>({
  sendEmailInvitation: async (user, entity) => {
    await strapi.plugins['email'].services.email.send({
      to: user.email,
      from: 'paul@communityoneproject.com',
      replyTo: 'paul@communityoneproject.com',
      subject: `${user.firstName}! You created a new team!`,
      text: `Your team ${entity.teamName} has been created.`,
      html: `Your team ${entity.teamName} has been created.`,
    });
  }
 
}));
