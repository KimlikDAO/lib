// kdts kdts/showcase/user.ts --strict

import { UserDto } from "./user.d";

interface User {
  firstName: string
  age: number
  weight: bigint
}

const serialize = (user: User): string => {
  const userDto = {
    firstName: user.firstName,
    age: user.age,
    weight: user.weight.toString(16)
  } as UserDto;
  return JSON.stringify(userDto);
}

const user: User = {
  firstName: "John",
  age: 30,
  weight: 10000n
} as User;

console.log(user.firstName, user.age, user.weight);
console.log(user);
console.log(serialize(user));
