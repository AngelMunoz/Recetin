import { autoinject } from 'aurelia-framework';
import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';
import { RecipeService } from 'services/recipes';
import { Events, Recipe } from 'types';

@autoinject
export class Recipes {

  recipes: Recipe[] = [];
  #subscriptions: Subscription[] = []

  constructor(private $recipes: RecipeService, private ea: EventAggregator, private router: Router) {
    this.#subscriptions.push(
      this.ea.subscribe(Events.CreatedRecipe, (recipe: Recipe) => this.recipes = [recipe, ...this.recipes])
    );
  }


  goTo(event: CustomEvent<string>, operation: 'view' | 'edit') {
    return this.router.navigate(`/recipes/${event.detail}?operation=${operation}`);
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
