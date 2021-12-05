
---
toc: 
nav:
title: 架构概览
order: 2
---
# 认证

## 用户对象
spring security中定义了`UserDetails`接口来规范开发者自定义的用户对象。

负责提供用户数据源的接口是`UserDetailsService`接口。项目中，一般需要开发自定义该接口的实现，从数据库中查询用户。
spring security也为`UserDetailsService`提供了默认实现，如`InMemoryUserDetailsManager`和`JdbcUserDetailsManager`。

## spring boot自动配置解析

### spring boot中用户对象的自动配置

spring boot中关于用户对象的自动配置路径为：`spring-boot-autoconfigure`包中的`org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration`、
从该类源码中可看到，有2个比较重要的条件，促使系统自动提供一个`InMemoryUserDetailsManager`实例：
- 当前 classpath下存在`AuthenticationManager`的类文件
- 当前项目中，IOC容器中没有`AuthenticationManager.class, AuthenticationProvider.class, UserDetailsService.class`的bean实例
~~~
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(AuthenticationManager.class)
@ConditionalOnBean(ObjectPostProcessor.class)
@ConditionalOnMissingBean(
		value = { AuthenticationManager.class, AuthenticationProvider.class, UserDetailsService.class },
		type = { "org.springframework.security.oauth2.jwt.JwtDecoder",
				"org.springframework.security.oauth2.server.resource.introspection.OpaqueTokenIntrospector" })
public class UserDetailsServiceAutoConfiguration {
~~~

从`inMemoryUserDetailsManager`方法中，可以看到用户数据源来自`SecurityProperties`。

~~~
@Bean
	@ConditionalOnMissingBean(
			type = "org.springframework.security.oauth2.client.registration.ClientRegistrationRepository")
	@Lazy
	public InMemoryUserDetailsManager inMemoryUserDetailsManager(SecurityProperties properties,
			ObjectProvider<PasswordEncoder> passwordEncoder) {
		SecurityProperties.User user = properties.getUser();
		List<String> roles = user.getRoles();
		return new InMemoryUserDetailsManager(
				User.withUsername(user.getName()).password(getOrDeducePassword(user, passwordEncoder.getIfAvailable()))
						.roles(StringUtils.toStringArray(roles)).build());
	}
~~~

从`SecurityProperties.User`类中，可以看到默认的用户名是user,默认的密码是UUID字符串,且由于`SecurityProperties`带有`@ConfigurationProperties(prefix = "spring.security")`，所以这些属性可以通过yml文件注入。
~~~
public static class User {

		/**
		 * Default user name.
		 */
		private String name = "user";

		/**
		 * Password for the default user name.
		 */
		private String password = UUID.randomUUID().toString();

		/**
		 * Granted roles for the default user name.
		 */
		private List<String> roles = new ArrayList<>();

~~~

### spring boot默认页面的生成
spring boot通过自动配置类，配置了2个和页面相关的过滤器：
- DefaultLoginPageGeneratingFilter
- DefaultLogoutPageGeneratingFilter

这些过滤器的doFilter方法处理用户的请求，生成html页面,通过响应返回给浏览器。

## 登陆表单的配置
在spring security中自定义配置，基本上都是继承自`WebSecurityConfigurerAdapter`来实现。
~~~
protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                .anyRequest().authenticated()
                .and()
                .formLogin()
                .loginPage("/mylogin.html")
                .loginProcessingUrl("/doLogin")
                .defaultSuccessUrl("/index.html")
                .failureUrl("/login.html")
                .usernameParameter("uname")
                .passwordParameter("passwd")
                .permitAll()
~~~
1. `authorizeRequests()`表示开启权限配置,`anyRequest().authenticated()`表示所有请求都要认证才能访问。
2. `formLogin()`表示开启表单登陆配置。
3. `loginPage()`用于指定登陆页面。
4. `loginProcessingUrl()`用于指定需要被处理的登陆请求url，与页面上的form表单的action属性一致。
5. `defaultSuccessUrl()`表示登陆成功后的跳转地址。
6. `failureUrl()`表示登陆失败的跳转地址。
7. `usernameParameter()`表示用户名的参数名称，与form表单一致。
8. `passwordParameter()`表示密码的参数名称，与form表单一致。
9. `permitAll()`表示跟登陆相关的页面和接口不做拦截。
### 登陆成功
当用户登陆成功之后，除了`defaultSuccessUrl`方法可以实现跳转,`successForwardUrl`也可以实现跳转，区别如下：
1. `defaultSuccessUrl`表示当用户登陆成功之后，会自动重定向到登陆之前的地址上。`successForwardUrl`则不考虑用户之前访问的地址，直接通过服务器转发跳转到指定页面。
2. `defaultSuccessUrl`有一个重载方法，如果重载方法第二个参数传入true，效果与`successForwardUrl`类似，重定向到指定页面。不同之处在于，`defaultSuccessUrl`是重定向，`successForwardUrl`是服务器转发。

无论是`defaultSuccessUrl`还是`successForwardUrl`，最终配置的都是`AuthenticationSuccessHandler`接口的实例。`AuthenticationSuccessHandler`接口专用于处理登陆成功的事情。

`AuthenticationSuccessHandler`有3个实现类：

![img.png](img/AuthenticationSuccessHandler实现类.png)

1. `SimpleUrlAuthenticationSuccessHandler`实现了请求重定向。
2. `SavedRequestAwareAuthenticationSuccessHandler`在父类的基础上，增加了请求缓存功能，可以记录之前请求地址，进而在登陆成功后重定向到缓存地址。
3. `ForwardAuthenticationSuccessHandler`就是一个服务端跳转。

`AuthenticationSuccessHandler`默认的三个实现类都是用来处理页面跳转的。在前后端分离开发时，后端不需要处理页面，只要在登陆成功后，跟前端返回一个JSON数据。像这样的需求，我们可以自定义`AuthenticationSuccessHandler`的实现类来完成，通过`successHandler`方法配置。
### 登陆失败
当用户登陆失败后，有2个方法可以实现跳转：
- `failureUrl`,表示登陆失败后重定向到指定页面。
- `failureForwardUrl`,表示登陆失败后服务端跳转。

服务端跳转的好处是可以携带登陆异常信息，自动调回登陆页面后可以将错误信息展示出来；重定向则不方便携带错误信息。

无论是`failureUrl`还是`failureForwardUrl`，最终配置的都是`AuthenticationFailureHandler`接口的实现。
![img.png](img/AuthenticationFailureHandler实现.png)

`AuthenticationFailureHandler`接口一共有5个实现类：
- `SimpleUrlAuthenticationFailureHandler`默认的处理逻辑就是重定向到指定页面，也可以通过配置`forwardToDestination`属性改为服务器跳转。`failureUrl`底层实现逻辑就是该实现类。
- `ForwardAuthenticationFailureHandler`就是服务端跳转，`failureForwardUrl`方法的底层就是该类。
- `AuthenticationEntryPointFailureHandler`可以通过 `AuthenticationEntryPoint`来处理登陆异常。
- `DelegatingAuthenticationFailureHandler`可以实现为不同的异常类型配置不同的登陆失败处理回调。

在前后端分离开发中，登陆失败不需要页面跳转，可以通过自定义`AuthenticationFailureHandler`的实现类来返回JSON，通过`failureHandler`方法来配置。

### 注销登陆
![img.png](img/注销登陆.png)

- 通过`logout`方法开启注销登陆配置
- `logoutUrl`方法指定注销登陆的请求地址，默认是GET请求，路径为`/logout`
- `invalidateHttpSession`表示是否使session失效，默认为true
- `clearAuthentication`表示是否清除认证信息，默认为true
- `logoutSuccessUrl()`表示注销登陆后的跳转地址。
- `logoutRequestMatcher`可以配置多个注销登陆请求并指定请求的方法
- `LogoutSuccessHandler`用于配置自定义的`LogoutSuccessHandler`，与前文类似，只是类不同
- `defaultLogoutSuccessHandlerFor`可以注册多个不同的注销成功回调函数，该方法第一个参数是`LogoutSuccessHandler`实现类，第二参数是具体的注销请求。

## 登陆用户数据获取

在spring security中，用户登陆信息本质上还是保存在HttpSession中，但是为了方便使用，Spring Security对HttpSession中的用户信息进行了封装，之后，开发者有3种思路获取用户信息：
- 从SecurityContextHolder中获取
- 从当前请求对象中获取
- 从HttpSession中获取

无论哪种获取方式都离不开`Authentication`对象。在spring security中，该对象主要有2方面功能：
- 作为`AuthenticationManager`的输入参数，提供用户身份认证的凭证。当它的`isAuthenticated`方法返回false时，表示用户还未认证。
- 代表已经通过认证的用户，此时可以从`SecurityContext`中获取。

一个`Authentication`对象主要包含三个方面的信息：
1. `principal`:定义认证的用户
2. `credentials`:登录凭证，一般指密码
3. `authorities`:用户被授予的权限信息

java本身提供了`Principal`接口用于描述认证主体（如一家公司、个人或者登录ID），spring security中定义了`Authentication`接口用来规范登录用户信息，`Authentication`继承自`Principal`。

不同的认证方式对应不同的`Authentication`对象。
### 从`SecurityContextHolder`中获取
~~~
 Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String name = authentication.getName();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        System.out.println("name = " + name);
        System.out.println("authorities = " + authorities);
~~~

#### `SecurityContextHolder`解析

![](img/securitycontextholder.png)

`SecurityContextHolder`中定义了三种不同的数据存储策略，这是一种典型的策略模式：
~~~
	public static final String MODE_THREADLOCAL = "MODE_THREADLOCAL";
	public static final String MODE_INHERITABLETHREADLOCAL = "MODE_INHERITABLETHREADLOCAL";
	public static final String MODE_GLOBAL = "MODE_GLOBAL";
~~~
1. `MODE_THREADLOCAL`:这种策略是将`SecurityContext`存放在`ThreadLocal`中。
2. `MODE_INHERITABLETHREADLOCAL`：这种存储模式适用于多线程环境，子线程也能获取到用户数据。
3. `MODE_GLOBAL`：将数据存放在一个静态变量中，在web开发中很少用到。

spring security中定义了`SecurityContextHolderStrategy`接口来规范存储策略中的方法。该接口一共有三个实现类，对应了三种策略。

![img.png](img/SecurityContextHolderStrategy实现.png)

