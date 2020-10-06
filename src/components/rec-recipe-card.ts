import { bindable, autoinject, computedFrom, bindingMode } from 'aurelia-framework';
import { Recipe } from 'types';

@autoinject
export class RecRecipeCard {
  @bindable({ binidingMode: bindingMode.toView })
  recipe?: Recipe;

  constructor(private el: Element) { }


  @computedFrom('recipe.description')
  get description(): string {
    return (this.recipe?.description?.slice(0, 48) ?? "") + "...";
  }

  onViewRecipe(recipeId: string) {
    this.el.dispatchEvent(new CustomEvent<string>('on-view-requested', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: recipeId
    }));
  }

  onEditRecipe(recipeId: string) {
    this.el.dispatchEvent(new CustomEvent<string>('on-edit-requested', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: recipeId
    }));
  }

  onDeleteRecipe(recipe: Recipe) {
    this.el.dispatchEvent(new CustomEvent<Recipe>('on-delete-requested', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: recipe
    }));
  }
}
