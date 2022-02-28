"use strict";

/**
 *  team controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

// TODO: move to utils or services
function userSanitizedData(member) {
  const user = {};

  user.id = member.id;
  user.email = member.email;
  user.firstName = member.firstName;
  user.lastName = member.lastName;
  user.title = member.title;
  user.inviteStatus = member.inviteStatus;
  user.inviteMessage = member.inviteMessage;
  user.createdAt = member.createdAt;

  return user;
}
// TODO: move to utils or services
function sanitizeUserData(entity) {
  
  if (entity.teamMembers) {
    entity.teamMembers = entity.teamMembers.map((member) => {
      return userSanitizedData(member);
    });
  }

  if (entity.hasOwnProperty("results")) {
    const { results } = entity;
    results.forEach((result) => {
      result.teamMembers = result.teamMembers.map((member) => {
        return userSanitizedData(member);
      });
    });
  }
}

module.exports = createCoreController("api::team.team", ({ strapi }) => ({
  async find(ctx) {
    const entity = await strapi
      .service("api::team.team")
      .find({ ...ctx, populate: ["teamMembers"] });

    sanitizeUserData(entity);

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    const entity = await strapi
      .service("api::team.team")
      .findOne(id, { ...query, populate: ["teamMembers"] });

    sanitizeUserData(entity);

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
