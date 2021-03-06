import LoginRouter from "../../src/presentation/routers/login-router";
import { UnauthorizedError, ServerError } from "../../src/presentation/errors";
import { MissingParamError, InvalidParamError } from "../../src/utils/generic-erros";

function makeSut () {
  const authUseCaseSpy = makeAuthUseCaseSpy();
  const emailValidatorSpy = makeEmailValidatorSpy();
  const sut = new LoginRouter({ authUseCase: authUseCaseSpy, emailValidator: emailValidatorSpy });

  return { sut, authUseCaseSpy, emailValidatorSpy };
}

function makeAuthUseCaseSpy () {
  class AuthUseCaseSpy {
    async auth ({ email, password }) {
      this.email = email;
      this.password = password;
      return this.accessToken;
    }
  }

  const authUseCase = new AuthUseCaseSpy();
  authUseCase.accessToken = "valid_token"; // mock with default as valid data
  return authUseCase;
}

function makeEmailValidatorSpy () {
  class EmailValidatorSpy {
    validate (email) {
      this.email = email;
      return this.isEmailValid;
    }
  }

  const emailValidatorSpy = new EmailValidatorSpy();
  emailValidatorSpy.isEmailValid = true; // mock with default as valid data
  return emailValidatorSpy;
}

describe("Login Router", () => {
  test("Should return 400 if no email is received", async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        password: "any_pass",
      },
    };
    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body.name).toBe(new MissingParamError("email").name);
  });

  test("Should return 400 if no password is received", async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        email: "any_email@email.com",
      },
    };
    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body.name).toBe(new MissingParamError("password").name);
  });

  test("Should return 500 if no httpRequest is received", async () => {
    const { sut } = makeSut();
    const httpResponse = await sut.handle();

    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body.name).toBe(new ServerError().name);
  });

  test("Should return 500 if httpRequest has no body", async () => {
    const { sut } = makeSut();
    const httpRequest = {};
    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body.name).toBe(new ServerError().name);
  });

  test("Should return 401 if invalid credentials are received", async () => {
    const { sut, authUseCaseSpy } = makeSut();
    authUseCaseSpy.accessToken = null;
    const httpRequest = {
      body: {
        email: "invalid_email@email.com",
        password: "invalid_pass",
      },
    };
    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(401);
    expect(httpResponse.body.name).toBe(new UnauthorizedError().name);
  });

  test("Should return 200 if valid credentials are received", async () => {
    const { sut, authUseCaseSpy } = makeSut();
    const httpRequest = {
      body: {
        email: "valid_email@email.com",
        password: "valid_pass",
      },
    };
    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(200);
    expect(httpResponse.body.accessToken).toEqual(authUseCaseSpy.accessToken);
  });

  test("Should return 500 if invalid authUseCase is received", async () => {
    const emailValidator = makeEmailValidatorSpy();
    const suts = [
      new LoginRouter({ authUseCase: undefined, emailValidator }),
      new LoginRouter({ authUseCase: {}, emailValidator }),
    ];
    const httpRequest = {
      body: {
        email: "any_email@email.com",
        password: "any_pass",
      },
    };

    for (const sut of suts) {
      const httpResponse = await sut.handle(httpRequest);

      expect(httpResponse.statusCode).toBe(500);
      expect(httpResponse.body.name).toBe(new ServerError().name);
    }
  });

  test("Should call AuthUseCase with correct params", async () => {
    const { sut, authUseCaseSpy } = makeSut();
    const httpRequest = {
      body: {
        email: "any_email@email.com",
        password: "any_pass",
      },
    };
    await sut.handle(httpRequest);

    expect(authUseCaseSpy.email).toBe(httpRequest.body.email);
    expect(authUseCaseSpy.password).toBe(httpRequest.body.password);
  });

  test("Should return 400 if invalid email is received", async () => {
    const { sut, emailValidatorSpy } = makeSut();
    emailValidatorSpy.isEmailValid = false;
    const httpRequest = {
      body: {
        email: "invalid_email@email.com",
        password: "any_pass",
      },
    };
    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body.name).toBe(new InvalidParamError("email").name);
  });

  test("Should return 500 if invalid emailValidator is received", async () => {
    const authUseCase = makeAuthUseCaseSpy();
    const suts = [
      new LoginRouter({ emailValidator: undefined, authUseCase }),
      new LoginRouter({ emailValidator: {}, authUseCase }),
    ];
    const httpRequest = {
      body: {
        email: "any_email@email.com",
        password: "any_pass",
      },
    };

    for (const sut of suts) {
      const httpResponse = await sut.handle(httpRequest);

      expect(httpResponse.statusCode).toBe(500);
      expect(httpResponse.body.name).toBe(new ServerError().name);
    }
  });

  test("Should call emailValidator with correct params", async () => {
    const { sut, emailValidatorSpy } = makeSut();
    const httpRequest = {
      body: {
        email: "any_email@email.com",
        password: "any_pass",
      },
    };
    await sut.handle(httpRequest);

    expect(emailValidatorSpy.email).toBe(httpRequest.body.email);
  });

  test("Should return 500 if no dependencies are received", async () => {
    const sut = new LoginRouter();
    const httpRequest = {
      body: {
        email: "any_email@email.com",
        password: "any_pass",
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body.name).toBe(new ServerError().name);
  });
});
