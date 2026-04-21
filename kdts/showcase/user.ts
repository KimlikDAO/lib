// kdts kdts/showcase/user.ts --strict

import { UserDto } from "./user.d";

interface User {
  firstName: string
  age: number
}

const serialize = (user: User): string => {
  const userDto: UserDto = {
    firstName: user.firstName,
    age: user.age,
  };
  return JSON.stringify(userDto);
}

const user: User = {
  firstName: "Abc",
  age: 20,
};

console.log(user);
console.log(serialize(user));
