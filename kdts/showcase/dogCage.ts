class Mammal {
  constructor(public name: string) { }
}

class Dog extends Mammal {
  constructor(name: string) { super(name); }
}

class Cage<Animal extends Mammal> {
  animal: Animal | undefined;
  place(animal: Animal) { this.animal = animal; }
  printName() {
    if (!this.animal)
      console.log("place animal first");
    else
      console.log(this.animal.name);
  }
}

const doggy = new Dog("doggy");
const cage = new Cage<Dog>();

cage.place(doggy);
cage.printName();
