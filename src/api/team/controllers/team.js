"use strict";

/**
 *  team controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

// TODO: move to utils or services
function userSanitizedData(member) {
  if (!member) return member;

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

  if (entity.hasOwnProperty("results")) {
    const { results } = entity;
    results.forEach((result) => {
      if (result.teamOwner) return entity;
      console.log(result.teamOwner, "####################");
      result.teamOwner = userSanitizedData(result.teamOwner);
    });
  }
}

module.exports = createCoreController("api::team.team", ({ strapi }) => ({
  async find(ctx) {
    const entity = await strapi
      .service("api::team.team")
      .find({ ...ctx, populate: ["teamMembers", "teamOwner"] });

    sanitizeUserData(entity);
    
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    const entity = await strapi
      .service("api::team.team")
      .findOne(id, { ...query, populate: ["teamMembers", "teamOwner"] });

    sanitizeUserData(entity);

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async create(ctx) {
    const { user } = ctx.state;
    const { data } = ctx.request.body;
    const entity = await strapi.service("api::team.team").create({
      data: { ...data, teamOwner: user.id },
    });
    return this.transformResponse(entity);
  },
}));

// this will not pulblish the team
// const team = await strapi.entityService.create("api::team.team",{
//   data: { ...data, teamOwner: user.id }
// })
