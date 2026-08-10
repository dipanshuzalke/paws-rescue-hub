import bird from "@/assets/case-bird.jpg";
import cat from "@/assets/case-cat.jpg";
import cow from "@/assets/case-cow.jpg";
import dog from "@/assets/case-dog.jpg";
import puppies from "@/assets/case-puppies.jpg";
import type { AnimalType } from "@/types";

export const caseImages = { dog, cat, cow, bird, puppies };

export const imageForAnimal = (animal: AnimalType, seed = 0): string => {
  switch (animal) {
    case "Dog":
      return seed % 3 === 0 ? puppies : dog;
    case "Cat":
      return cat;
    case "Cow":
      return cow;
    case "Bird":
      return bird;
    default:
      return seed % 2 === 0 ? dog : cow;
  }
};