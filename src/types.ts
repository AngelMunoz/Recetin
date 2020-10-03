export type Ingredient = {
  name: string;
  amount: string;
  unit: string;
  replacements?: Ingredient[];
};

export type RecipeStep = {
  order: number;
  directions: string;
  image?: Blob;
};

export type Recipe = {
  _id: string;
  _rev?: string;
  title: string;
  description: string;
  notes?: string;
  image?: Blob;
  steps: RecipeStep[];
  ingredients: Ingredient[];
};


export type IconName =
  | 'Add'
  | 'Edit'
  | 'Trash'
  | 'Save'
  | 'MoreVert'
  | 'Cancel'
  | 'Upload';

export enum Events {
  CreatedRecipe = 'CreatedRecipe'
}
