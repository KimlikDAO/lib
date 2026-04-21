type User = { id: string, age: number }

const user: User = { id: "Abc", age: 20 };

type Person = { id: string, age: number };

const person: Person = user;

console.log(person);

interface Animal {
  name: string;
  makeSound(): void;
}

interface Dog extends Animal {
  breed: string;
}

const dog: Dog = {
  name: "Buddy",
  breed: "Golden Retriever",
  makeSound() {
    console.log("Woof!");
  },
};

console.log(dog.name); // "Buddy"
const animal: Animal = dog;
animal.makeSound();       // "Woof!"

interface A { a: string }
interface B { a: string }
const a: A = { a: "a" };
const b: B = a as B;

console.log(b);
