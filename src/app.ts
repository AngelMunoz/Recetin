import { PLATFORM, autoinject } from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator'
import { RouterConfiguration, Router } from 'aurelia-router';
import { FormRecipeValue } from 'components/recipe-form';
import { RecipeService } from 'services/recipes';
import { Events } from 'types';
import UIkit from 'uikit';

@autoinject
export class App {
  private router: Router;
  private newRecipe: FormRecipeValue =
    {
      title: 'Mi Receta',
      description: '',
      ingredients: [],
      steps: []
    }
  private recipeTitleError = false;
  private preventSave = false;

  constructor(private $recipes: RecipeService, private ea: EventAggregator) { }

  trySaveRecipe(event: CustomEvent<FormRecipeValue>) {
    this.preventSave = true;
    return this.$recipes.saveRecipe(event.detail).then(_ => {
      this.preventSave = false;
      this.newRecipe = {
        title: 'Mi Receta',
        description: '',
        ingredients: [],
        steps: []
      };
      UIkit.notification({
        message: `"${_.title}" ha sido guardada con exito`,
        status: 'success'
      });
      this.ea.publish(Events.CreatedRecipe, _);
    })
      .catch(console.error);
  }

  async checkRecipeName(event: CustomEvent<string>) {
    try {
      const exists = await this.$recipes.recipeNameExists(event.detail);
      this.recipeTitleError = exists;
    } catch (error) {
      console.warn("appts:err:", { error });
    }
  }
  

  private configureRouter(config: RouterConfiguration, router: Router): void {
    this.router = router;
    config.title = 'Recetin';
    config.map([
      { route: '', name: 'recipes', moduleId: PLATFORM.moduleName('./pages/recipes'), nav: true, title: 'Recetas' },
      { route: 'recipes/:recipeid', name: 'recipe', moduleId: PLATFORM.moduleName('./pages/recipe-detail'), nav: false, title: 'Receta' }
    ]);
  }
}
