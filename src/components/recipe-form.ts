import { bindable, bindingMode, autoinject } from 'aurelia-framework';
import { SaveRecipeProps } from 'services/recipes';
import { Ingredient, Recipe, RecipeStep } from 'types';


export type FormRecipeValue = Partial<Recipe> & SaveRecipeProps;

@autoinject
export class RecipeForm {

  @bindable({ bindingMode: bindingMode.toView })
  recipe: Partial<Recipe> & SaveRecipeProps = {
    title: 'My Recipe',
    description: '',
    ingredients: [],
    steps: []
  }

  @bindable({ bindingMode: bindingMode.toView })
  preventSave = false;

  @bindable({ bindingMode: bindingMode.toView })
  recipeTitleError = false;

  @bindable({ bindingMode: bindingMode.toView })
  isInOffCanvas: boolean | 'true' | 'false' = false;

  constructor(private el: Element) { }

  attached() {
    if(this.recipe && this.recipe.title) {
      const evt = new CustomEvent<string>('on-title-changed', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: this.recipe.title
      });
      this.el.dispatchEvent(evt);
    }
  }

  onSubmit() {
    const evt = new CustomEvent<FormRecipeValue>('on-submit', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: { ...this.recipe }
    });
    this.el.dispatchEvent(evt);
  }

  onStepMoved(event: CustomEvent<[any, HTMLLIElement]>) {
    const [component, movedLi] = event.detail;
    const currentOrder: HTMLLIElement[] = component?.items;
    const steps = this.recipe.steps.map(step => {
      step.order = currentOrder.findIndex(li => Number(li.dataset.order) === step.order);
      return step
    });
    this.recipe = { ...this.recipe, steps };
  }

  onTitleChanged(event: KeyboardEvent) {
    const evt = new CustomEvent<string>('on-title-changed', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: (event.target as HTMLInputElement).value
    });
    this.el.dispatchEvent(evt);
  }

  addIngredient() {
    const ingredients = [
      ...this.recipe.ingredients,
      {
        amount: '', name: '', unit: '', replacements: []
      }
    ]
    this.recipe = { ...this.recipe, ingredients }
  }

  addReplacement(ingredient: Ingredient) {
    const replacements: Ingredient[] = [...ingredient.replacements, { amount: '', name: '', unit: '', replacements: [] }]
    const ingredients = this.recipe.ingredients.map(i => i.name === ingredient.name ? { ...ingredient, replacements } : i);
    this.recipe = { ...this.recipe, ingredients };
  }

  addStep() {
    const steps: RecipeStep[] = [
      ...this.recipe.steps,
      {
        directions: '',
        order: this.recipe.steps?.length ?? 0
      }
    ]
    this.recipe = { ...this.recipe, steps };
  }

  removeIngredient(ingredient: Ingredient) {
    this.recipe = { ...this.recipe, ingredients: this.recipe.ingredients.filter(i => i.name !== ingredient.name) }
  }

  removeReplacement(ingredient: Ingredient, replacement: Ingredient) {
    const replacements = ingredient.replacements.filter(i => i.name !== replacement.name);
    const ingredients = this.recipe.ingredients.map(i => i.name === ingredient.name ? { ...ingredient, replacements } : i);
    this.recipe = { ...this.recipe, ingredients };
  }

  removeStep(step: RecipeStep) {
    this.recipe = { ...this.recipe, steps: this.recipe.steps.filter(s => s.order !== step.order) }
  }
}
