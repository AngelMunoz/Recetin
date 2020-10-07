import type { Recipe, Ingredient, RecipeStep } from 'types';
import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);

const recipes = new PouchDB<Recipe>('recipes');
(async () => {
  const titleIndex = recipes.createIndex({
    index: {
      fields: ['title'],
      ddoc: 'recetinTitleddoc',
      name: 'findByTitleIndex'
    }
  });

  try {
    const result = await Promise.allSettled([titleIndex]);
    console.info({ createIndexesResult: result });
  } catch (error) {
    console.warn({ createIndexesError: error });
  }
})();

async function recipeNameExists(title: string): Promise<boolean> {
  try {
    const docs = await recipes.find({
      selector: { title },
      fields: ['title'],
      use_index: ['recetinTitleddoc', 'findByTitleIndex']
    });
    return docs.docs.length > 0;
  } catch (error) {
    console.warn({ RecipeNameExistsError: error })
    return Promise.reject(error.message);
  }
}

function getBlobFromAttachment(attachments?: PouchDB.Core.Attachments) {
  const { recipeImage } = attachments ?? {};
  return (recipeImage as PouchDB.Core.FullAttachment | undefined)?.data as Blob | undefined
}

function mapResultToRecipe({ _id, title, _rev, description, ingredients, steps, _attachments, notes }: Recipe & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta): Recipe {
  return { _id, title, _rev, description, ingredients, steps, notes, image: getBlobFromAttachment(_attachments) };
}

export type SaveRecipeProps = Pick<Recipe, 'title' | 'description' | 'ingredients' | 'steps'> & { _id?: string, _deleted?: boolean };

async function saveRecipe(recipe: SaveRecipeProps, recipeImg?: File): Promise<Recipe | void> {
  const recipeId = recipe._id ? recipe._id : `recetin:${recipe.title}:${Date.now()}`
  const attachments: PouchDB.Core.Attachments | undefined = recipeImg ? {
    recipeImage: {
      content_type: recipeImg.type,
      length: File.length,
      data: recipeImg
    }
  } : undefined
  try {
    const result = await recipes.put({
      ...recipe,
      _id: recipeId,
      ingredients: recipe.ingredients ?? [],
      steps: recipe.steps ?? [],
      _attachments: attachments
    });
    if(recipe._deleted) {
      return;
    }
    const findResult = await recipes.get<Recipe>(result.id, { attachments: true, binary: true });
    return mapResultToRecipe(findResult)
  } catch (error) {
    console.warn({ SaveRecipeError: error });
    return Promise.reject(error.message);
  }
}


async function getRecipes(): Promise<{ recipes: Recipe[], count: number }> {
  try {
    const { rows, total_rows } = await recipes.allDocs<Recipe>({ attachments: true, binary: true, include_docs: true });
    const mappedRecipes =
      rows
        .filter(row => !row.id.includes('_design'))
        .map(row => ({
          _id: row.id,
          description: row.doc?.description ?? '',
          ingredients: row.doc?.ingredients ?? [],
          steps: row.doc?.steps ?? [],
          title: row.doc?.title ?? '',
          _rev: row.doc?._rev,
          notes: row.doc?.notes,
          image: getBlobFromAttachment(row.doc?._attachments)
        }))
    return {
      recipes: mappedRecipes, count: total_rows
    }
  } catch (error) {
    console.warn({ GetRecipesError: error });
    return Promise.reject(error.message);
  }
}

async function getRecipe(recipeId: string) {
  return recipes.get<Recipe>(recipeId, { attachments: true, binary: true }).then(mapResultToRecipe)
}


/**
 * 
 * @param {Ingredient} ingredient
 * @returns {string}
 */
function stringifyIngredient(ingredient: Ingredient): string {
  let mainIng = `${ingredient.name.trim()} ; ${ingredient.amount.trim()}, ${ingredient.unit.trim()}`;
  const replacements = ingredient?.replacements?.map(stringifyIngredient) ?? [];
  for (const replacement of replacements) {
    mainIng += `\n+ ${replacement}`;
  }
  return mainIng;
}

/**
 * 
 * @param {RecipeStep} step
 * @returns {string}
 */
function stringifyStep(step: RecipeStep): string {
  return `.- ${step.order + 1} ~ ${step.directions.split('\n').join('\n.~ ').trim()}`;
}

/**
 * 
 * @param {Recipe} recipe 
 * @returns {string}
 */
function stringifyRecipe(recipe: Recipe, isExport = false): string {
  let mainStuff = `> ${recipe.title.split('\n').join('\n>').trim()}\n< ${recipe.description.split('\n').join('\n< ').trim()}\n= ${recipe?.notes?.split('\n')?.join('\n= ') ?? ""}`;
  const ingredients = recipe?.ingredients?.map(stringifyIngredient) ?? [];
  for (const ingredient of ingredients) {
    mainStuff += `\n~ ${ingredient}`;
  }
  const steps = recipe?.steps?.map(stringifyStep) ?? [];
  for (const step of steps) {
    mainStuff += `\n${step}`;
  }
  if(!isExport) {
    return mainStuff.replace(/[>~=<+;]|(\.-|\.~)/ig, '');
  }
  return mainStuff
}

function parseIngredient(ingredient: string): [string, string, string] {
  const [name, amountUnit] = ingredient.split(';')
  const [amount, unit] = amountUnit.split(',')
  return [name.trim(), amount.trim(), unit.trim()];
}

export function grouptToObjIngredient([name, amount, unit, ...replacements]: [string, string, string, ...[string, string, string][]]) {
  return { name, amount, unit, replacements: replacements.map(grouptToObjIngredient) };
}

function groupToRecipe(groupedRecipe: [string, string, [string, string, string, ...[string, string, string][]][], string[]]): SaveRecipeProps {
  const [title, description, ings, stps] = groupedRecipe;
  const ingredients = ings.map(grouptToObjIngredient);
  const steps = stps.map((directions, i) => ({ directions, order: i }));
  return { title: title.trim(), description: description.trim(), ingredients, steps };
}

function parseRecipe(recipe: string) {
  const parts = recipe.split('\n');
  const grouped: [string, string, [string, string, string, ...[string, string, string][]][], string[]] = parts.reduce((prev, next) => {
    let [preTitle, preDescription, preIngs, preSteps] = prev;
    const t = next.startsWith('>') ? (preTitle + next.substring(1)) : preTitle;
    const d = next.startsWith('<') ? (preDescription + next.substring(1)) : preDescription;
    if (next.startsWith('~')) {
      const [name, amount, unit] = parseIngredient(next.substring(1));
      preIngs = [...preIngs, [name, amount, unit]]
    }

    if (next.startsWith('+')) {
      const lastIndex = preIngs.length - 1;
      if (lastIndex >= 0) {
        const replacement = parseIngredient(next.substring(1));
        preIngs[lastIndex].push(replacement)
      }
    }

    if (next.startsWith('.-')) {
      var [order, partialDir] = next.substring(2).trimStart().split('~')
      const index = Number(order.trim());
      preSteps.splice(index, 1, partialDir.trim())
    }
    if (next.startsWith('.~')) {
      (preSteps[preSteps.length - 1] as string) = preSteps[preSteps.length - 1] + next.substring(2)
    }
    return [t, d, preIngs, preSteps];
  }, ["", "", [] as [string, string, string, ...[string, string, string][]][], [] as string[]]);
  return groupToRecipe(grouped);
}


export interface IRecipeService {
  recipeNameExists(title: string): Promise<boolean>;
  saveRecipe(recipe: SaveRecipeProps, recipeImg?: File): Promise<Recipe | void>;
  getRecipes(): Promise<{ recipes: Recipe[], count: number }>;
  getRecipe(recipeId: string): Promise<Recipe>;
  stringify(recipe: Recipe, isExport?: boolean): string;
  parse(recipe: string): SaveRecipeProps;
}

export class RecipeService implements IRecipeService {
  recipeNameExists: (title: string) => Promise<boolean> = recipeNameExists.bind(this);
  saveRecipe: (recipe: SaveRecipeProps, recipeImg?: File) => Promise<Recipe | void> = saveRecipe.bind(this);
  getRecipes: () => Promise<{ recipes: Recipe[], count: number }> = getRecipes.bind(this);
  getRecipe: (recipeId: string) => Promise<Recipe> = getRecipe.bind(this);
  stringify: (recipe: Recipe, isExport?: boolean) => string = stringifyRecipe;
  parse: (recipe: string) => SaveRecipeProps = parseRecipe;
}
