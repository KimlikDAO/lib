// kdts kdts/showcase/user.ts --strict

import { UserDto } from "./user.d";

interface User {
  firstName: string
  age: number
  weight: bigint
}

const serialize = (user: User): string => {
  const userDto: UserDto = {
    firstName: user.firstName,
    age: user.age,
    weight: user.weight.toString(16)
  };
  return JSON.stringify(userDto);
}

const user: User = {
  firstName: "John",
  age: 30,
  weight: 10000n
};

console.log(user.firstName, user.age, user.weight);
console.log(user);
console.log(serialize(user));
