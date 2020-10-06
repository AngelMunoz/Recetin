import { autoinject } from 'aurelia-framework';
import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';
import { RecipeService, SaveRecipeProps } from 'services/recipes';
import { Events, Recipe } from 'types';
import UIkit from 'uikit';

@autoinject
export class Recipes {

  recipes: Recipe[] = [];
  #subscriptions: Subscription[] = []
  private deleteRecipe?: Recipe;
  private cancelModal: HTMLDivElement = null;

  constructor(private $recipes: RecipeService, private ea: EventAggregator, private router: Router) {
    this.#subscriptions.push(
      this.ea.subscribe(Events.CreatedRecipe, (recipe: Recipe) => this.recipes = [recipe, ...this.recipes])
    );
  }


  goTo(event: CustomEvent<string>, operation: 'view' | 'edit') {
    return this.router.navigate(`/recipes/${event.detail}?operation=${operation}`);
  }

  tryDelete(event: CustomEvent<Recipe>) {
    if (!event.detail) return;
    this.deleteRecipe = { ...event.detail };
    UIkit.modal(this.cancelModal).show();
  }

  async continueDeleteRecipe() {
    try {
      await this.$recipes.saveRecipe({ ...this.deleteRecipe, _deleted: true } as SaveRecipeProps)
      this.recipes = this.recipes.filter(r => r._id !== this.deleteRecipe._id);
      this.deleteRecipe = undefined;
      UIkit.modal(this.cancelModal).hide();
    } catch (error) {
      console.warn({ deleteError: error });
    }
  }

  activate() {
    this.$recipes.getRecipes().then(({ recipes }) => this.recipes = recipes);
  }

  deactivate() {
    for (const sub of this.#subscriptions) {
      sub.dispose();
    }
  }
}
