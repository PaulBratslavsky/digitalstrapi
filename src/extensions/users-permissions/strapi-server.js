const _ = require("lodash");
const utils = require("@strapi/utils");
const { sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;
const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const getService = (name) => {
  return strapi.plugin("users-permissions").service(name);
};

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

const { validateRegisterBody } = require("./validation/auth");

module.exports = (plugin) => {
  plugin.controllers.auth.registerUser = async (ctx) => {

    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    const settings = await pluginStore.get({
      key: "advanced",
    });

    if (!settings.allow_register) {
      throw new ApplicationError("Register action is currently disabled");
    }

    const params = {
      ..._.omit(ctx.request.body, [
        "confirmed",
        "confirmationToken",
        "resetPasswordToken",
      ]),
      provider: "local",
    };

    // TODO: find out more what this does exactly
    validateRegisterBody(params);
  
    // Throw an error if the password selected by the user
    // contains more than three times the symbol '$'.
    if (getService("user").isHashed(params.password)) {
      throw new ValidationError(
        "Your password cannot contain more than three times the symbol `$`"
      );
    }

    const role = await strapi
      .query("plugin::users-permissions.role")
      .findOne({ where: { type: settings.default_role } });

    if (!role) {
      throw new ApplicationError("Impossible to find the default role");
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    const hasFirstName = params.firstName && params.firstName.length > 0;
    const hasLastName = params.lastName && params.lastName.length > 0;

    // TODO: check github issue test
    if (!hasFirstName) throw new ValidationError("Please provide a first name");
    if (!hasLastName) throw new ValidationError("Please provide a last name");

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      throw new ValidationError("Please provide a valid email address");
    }

    params.role = role.id;

    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: { email: params.email },
    });

    if (user && user.provider === params.provider) {
      throw new ApplicationError("Email is already taken");
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      throw new ApplicationError("Email is already taken");
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      const userData = {
        username: params.username,
        password: params.password,
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
      }

      const user = await getService("user").add(userData);

      const sanitizedUser = await sanitizeUser(user, ctx);

      if (settings.email_confirmation) {
        try {
          await getService("user").sendConfirmationEmail(sanitizedUser);
        } catch (err) {
          throw new ApplicationError(err.message);
        }

        return ctx.send({ user: sanitizedUser });
      }

      const jwt = getService("jwt").issue(_.pick(user, ["id"]));

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      console.log(err);
      if (_.includes(err.message, "username")) {
        throw new ApplicationError("Username already taken");
      } else if (_.includes(err.message, "email")) {
        throw new ApplicationError("Email already taken");
      } else {
        strapi.log.error(err);
        throw new ApplicationError("An error occurred during account creation");
      }
    }
  };

  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/auth/local/registerUser",
    handler: "auth.registerUser",
    config: {
      prefix: "",
    },
  });

  return plugin;
};
