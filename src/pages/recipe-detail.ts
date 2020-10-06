import { autoinject } from 'aurelia-framework'
import { RecipeService, SaveRecipeProps } from 'services/recipes';
import { AppState, Ingredient, Recipe, RecipeStep } from 'types';
import { Redirect } from 'aurelia-router';
import { deepEqual } from 'utils';
import { connectTo, Store } from 'aurelia-store';
import { pluck } from 'rxjs/operators'
import UIkit from 'uikit';

type RecipeParams = { recipeid?: string, operation?: 'view' | 'edit' }

@autoinject()
@connectTo<AppState>({
  selector: {
    canShare: (store: Store<AppState>) => store.state.pipe(pluck('canUseShareAPI')),
    canUseClipboard: (store: Store<AppState>) => store.state.pipe(pluck('canUseClipboardAPI'))
  }
})
export class RecipeDetail {
  public isEditing = false;
  public recipeTitleError = false;
  public preventSave = false;

  public recipe?: Recipe;

  private newIngredients: Ingredient[] = [];
  private newSteps: RecipeStep[] = [];

  private _original?: Recipe;

  cancelModal: HTMLDivElement = null;

  public canShare?: boolean;
  public canUseClipboard?: boolean;


  constructor(private $recipes: RecipeService) { }

  public startEdit() {
    this._original = { ...this.recipe };
    this.isEditing = true;
  }

  public startCancelEdit() {
    if (!deepEqual(this.recipe, this._original)) {
      UIkit.modal(this.cancelModal).show();
      return;
    }
    this.isEditing = false;
  }

  public cancelEdit() {
    UIkit.modal(this.cancelModal).hide();
    this.recipe = { ...this._original };
    this.isEditing = false;
    this._original = undefined;
  }

  public async startShare(isExport = false) {
    try {
      await navigator.share({ text: this.$recipes.stringify(this.recipe, isExport), title: this.recipe.title });
    } catch (error) {
      console.warn({ shareError: error });
      UIkit.notification('No se pudo compartir la receta', { status: 'warning' })
    }
  }

  public async startCopy(isExport = false) {
    try {
      await navigator.clipboard.writeText(this.$recipes.stringify(this.recipe, isExport));
    } catch (error) {
      console.warn({ copyError: error });
      UIkit.notification('No se pudo copiar la receta', { status: 'warning' })
    }
  }



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
        var promise: Promise<Recipe> = this.$recipes.saveRecipe(recipe) as Promise<Recipe>;
        break;
      }
      case 'steps': {
        const recipe: Recipe = { ...this.recipe, steps: values as RecipeStep[] }
        var promise: Promise<Recipe> = this.$recipes.saveRecipe(recipe) as Promise<Recipe>;
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
    return this.$recipes.saveRecipe(event.detail).then((recipe: Recipe) => {
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
    try {
      this.recipe = await this.$recipes.getRecipe(recipeid);
      if ((operation ?? '').toLowerCase() === 'edit') {
        this.startEdit();
      }
    } catch (error) {
      console.warn({ activateError: error });
    }
  }

}
