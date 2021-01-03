import MongoHelper from "../../../src/domain/repositories/helpers/mongo-helper";
import UserRepository from "../../../src/domain/repositories/user-repository.js";
import { MissingParamError } from "../../../src/utils/generic-erros";

let userModel;

function makeSut () {
  const sut = new UserRepository(userModel);
  return { sut, userModel };
}

describe("User Repository", () => {
  beforeAll(async () => {
    await MongoHelper.connect(process.env.MONGO_URL);
    userModel = await MongoHelper.getCollection("users");
  });

  beforeEach(async () => {
    await userModel.deleteMany();
  });

  afterAll(async () => {
    await MongoHelper.disconnect();
  });

  test("Method findByEmail should return null if no user is found", async () => {
    const { sut } = makeSut();
    const user = await sut.findByEmail("invalid_email@email.com");

    expect(user).toBeNull();
  });

  test("Method findByEmail should return an user if user is found", async () => {
    const { sut, userModel } = makeSut();
    const fakeUser = await userModel.insertOne({
      name: "any_name",
      email: "valid_email@email.com",
      password: "hashed_password",
    });
    const user = await sut.findByEmail("valid_email@email.com");

    expect(user).toEqual({
      _id: fakeUser.ops[0]._id,
      password: fakeUser.ops[0].password,
      email: fakeUser.ops[0].email,
    });
  });

  test("Method findByEmail should throw if no email is received", async () => {
    const { sut } = makeSut();
    const promise = sut.findByEmail();

    await expect(promise).rejects.toThrow(new MissingParamError("email"));
  });

  test("Method findByEmail should throw if no userModel is received", async () => {
    const sut = new UserRepository();
    const promise = sut.findByEmail("valid_email@email.com");

    await expect(promise).rejects.toThrow(new MissingParamError("userModel"));
  });

  test("Method updateAccessToken should update the user with the given accessToken", async () => {
    const { sut, userModel } = makeSut();
    const fakeUser = await userModel.insertOne({
      name: "any_name",
      email: "valid_email@email.com",
      password: "hashed_password",
    });
    await sut.updateAccessToken(fakeUser.ops[0]._id, "valid_token");
    const updatedUser = await userModel.findOne({ _id: fakeUser.ops[0]._id });

    expect(updatedUser.accessToken).toBe("valid_token");
  });

  test("Method updateAccessToken should throw if no userId is received", async () => {
    const { sut } = makeSut();
    const promise = sut.updateAccessToken();

    await expect(promise).rejects.toThrow(new MissingParamError("userId"));
  });

  test("Method updateAccessToken should throw if no accessToken is received", async () => {
    const { sut } = makeSut();
    const promise = sut.updateAccessToken("valid_id");

    await expect(promise).rejects.toThrow(new MissingParamError("accessToken"));
  });

  test("Method updateAccessToken should throw if no userModel is received", async () => {
    const sut = new UserRepository();
    const promise = sut.updateAccessToken("valid_id", "valid_token");

    await expect(promise).rejects.toThrow(new MissingParamError("userModel"));
  });
});
