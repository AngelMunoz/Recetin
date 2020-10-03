import { autoinject } from 'aurelia-framework'
import { RecipeService, SaveRecipeProps } from 'services/recipes';
import { Ingredient, Recipe, RecipeStep } from 'types';
import { Redirect } from 'aurelia-router';
import UIkit from 'uikit';


type RecipeParams = { recipeid?: string, operation?: 'view' | 'edit' }

@autoinject
export class RecipeDetail {
  public isEditing = false;
  public recipeTitleError = false;
  public preventSave = false;

  public recipe?: Recipe;

  private newIngredients: Ingredient[] = [];
  private newSteps: RecipeStep[] = [];

  constructor(private $recipes: RecipeService) { }

  public addNewIngredient() {
    this.newIngredients = [...this.newIngredients, { name: '', amount: '', unit: '', replacements: [] }];
  }

  public addNewIngredientReplacement(ingredient: number) {
    const replacements: Ingredient[] = [...this.newIngredients?.[ingredient].replacements, { name: '', amount: '', unit: '' }]
    this.newIngredients = this.newIngredients.map((ing, i) => i === ingredient ? { ...ing, replacements } : ing);
  }

  public addNewStep() {
    this.newSteps = [...this.newSteps, { directions: '', order: this.newSteps.length }];
  }

  public removeNewIngredient(index: number) {
    const newArr = [...this.newIngredients];
    newArr.splice(index, 1);
    this.newIngredients = [...newArr];
  }

  public removeNewIngredientReplacement(ingredient: number, replacement: number) {
    const replacements = [...this.newIngredients?.[ingredient].replacements];
    replacements.splice(replacement, 1);
    this.newIngredients = this.newIngredients.map((ing, i) => i === ingredient ? { ...ing, replacements } : ing);
  }

  public removeNewStep(index: number) {
    const newArr = [...this.newSteps];
    newArr.splice(index, 1);
    this.newSteps = [...newArr];
  }

  public async trySaveRecipe(type: 'ingredients' | 'steps', values: Ingredient[] | RecipeStep[]) {
    let recipe: Recipe;
    const msg = `${type === 'ingredients' ? 'Ingredientes' : 'Pasos'}`
    switch (type) {
      case 'ingredients': {
        const recipe: Recipe = { ...this.recipe, ingredients: values as Ingredient[] }
        var promise: Promise<Recipe> = this.$recipes.saveRecipe(recipe);
        break;
      }
      case 'steps': {
        const recipe: Recipe = { ...this.recipe, steps: values as RecipeStep[] }
        var promise: Promise<Recipe> = this.$recipes.saveRecipe(recipe);
        break;
      }
    }
    try {
      recipe = await promise;
      this.recipe = { ...recipe };
      if (type === 'ingredients') { this.newIngredients = [] } else { this.newSteps = []; }
      UIkit.notification(`${msg} guardados con exito`, { status: 'success' });
    } catch (error) {
      console.warn({ trySaveRecipe: error });
      UIkit.notification(`Hubo un error al guardar los ${msg}`, { status: 'success' });
    }
  }

  public async trySaveEdit(event: CustomEvent<SaveRecipeProps>) {
    this.preventSave = true;
    return this.$recipes.saveRecipe(event.detail).then(recipe => {
      this.preventSave = false;
      this.recipe = { ...recipe };
      UIkit.notification({
        message: `"${recipe.title}" ha sido guardada con exito`,
        status: 'success'
      });
      this.isEditing = false;
    })
      .catch(console.error);
  }

  async checkRecipeName(event: CustomEvent<string>) {
    try {
      const exists = await this.$recipes.recipeNameExists(event.detail);
      this.recipeTitleError = this.recipe?.title === event.detail ? false : exists;
    } catch (error) {
      console.warn("appts:err:", { error });
    }
  }

  async activate({ operation, recipeid }: RecipeParams, routeConfig, navigationInstruction) {
    if (!recipeid) { return new Redirect('', { replace: true }); }
    this.isEditing = (operation ?? '').toLowerCase() === 'edit';
    try {
      this.recipe = await this.$recipes.getRecipe(recipeid);
    } catch (error) {
      console.warn({ activateError: error });
    }
  }

}
